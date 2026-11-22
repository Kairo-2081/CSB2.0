// Access rules: the "done when" checks from the security plan, as tests.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, client, signUp, makeAdmin } from './helpers.js';
import { PUBLIC_ROUTES } from '../../server/app.js';

const pool = newPool();
let srv;

before(async () => {
  await resetDatabase(pool);
  srv = await startServer(pool);
});
after(async () => {
  await srv.close();
  await pool.end();
});

const BOARDS = {
  complaints: { title: 'Broken fan', description: 'Room 204 fan is broken', category: 'hall' },
  marketplace: { title: 'Calculator', description: 'fx-991ES', price: 900, category: 'Electronics' },
  'lost-found': { title: 'Blue pen', description: 'Lost near the library', item_type: 'lost', location: 'Library' },
  'animal-welfare': { title: 'Injured cat', description: 'Limping near the gate', location: 'Main gate', urgency: 'high' },
  'faculty-suggestions': { title: 'More examples', faculty_name: 'Dr X', subject: 'CSE 101', rating: 4, feedback: 'More worked examples please' },
  'blood-donation': { blood_type: 'O-', contact_number: '01700000000', location: 'Titumir Hall', consent: true },
  bicycles: { brand: 'Duranta', color: 'Red', description: 'Good condition' },
};

describe('default deny', () => {
  test('every route outside PUBLIC_ROUTES answers 401 without a session', async () => {
    const anon = client(srv.base);
    const routes = [];
    for (const layer of srv.app._router.stack) {
      if (!layer.route || !layer.route.path.startsWith('/api')) continue;
      for (const method of Object.keys(layer.route.methods)) {
        routes.push([method.toUpperCase(), layer.route.path]);
      }
    }
    assert.ok(routes.length > 30, `expected the full route table, found ${routes.length}`);
    for (const [method, path] of routes) {
      if (PUBLIC_ROUTES.has(`${method} ${path}`)) continue;
      const url = path.replace(/:id/g, 'some-id');
      const res = await (method === 'GET' ? anon.get(url) : method === 'DELETE' ? anon.del(url) : anon[method.toLowerCase()](url, {}));
      assert.equal(res.status, 401, `${method} ${path} answered ${res.status}`);
    }
  });

  test('public routes still work without a session', async () => {
    const anon = client(srv.base);
    assert.equal((await anon.get('/api/health')).status, 200);
    assert.equal((await anon.get('/api/universities')).status, 200);
    assert.equal((await anon.get('/api/public/campus-stats')).status, 200);
  });
});

describe('writes take the user from the session', () => {
  test('a POST carrying another user_id and posted_by stores the signed-in user', async () => {
    const alice = await signUp(srv.base, { name: 'Alice' });
    const bob = await signUp(srv.base, { name: 'Bob' });
    const res = await alice.c.post('/api/complaints', {
      ...BOARDS.complaints, user_id: bob.user.id, posted_by: 'Bob',
    });
    assert.equal(res.status, 201);
    assert.equal(res.data.posted_by, 'Alice');
    assert.equal(res.data.is_mine, true);
    assert.equal(res.data.user_id, undefined, 'user_id must not be exposed');
    const row = await pool.query('SELECT user_id, university_id FROM complaints WHERE id = $1', [res.data.id]);
    assert.equal(row.rows[0].user_id, alice.user.id);
    assert.equal(row.rows[0].university_id, 'buet');
  });

  test('every board POST without a session gets 401', async () => {
    const anon = client(srv.base);
    for (const [board, body] of Object.entries(BOARDS)) {
      assert.equal((await anon.post(`/api/${board}`, body)).status, 401, board);
    }
  });

  test('every board accepts a valid post and rejects an invalid one with 400', async () => {
    const s = await signUp(srv.base);
    for (const [board, body] of Object.entries(BOARDS)) {
      const ok = await s.c.post(`/api/${board}`, body);
      assert.equal(ok.status, 201, `${board}: ${JSON.stringify(ok.data)}`);
      const bad = await s.c.post(`/api/${board}`, { ...body, title: '', brand: '', blood_type: 'Z+', description: 'x'.repeat(5000) });
      assert.equal(bad.status, 400, `${board} accepted an invalid body`);
    }
  });

  test('complaints can be anonymous without losing ownership', async () => {
    const s = await signUp(srv.base, { name: 'Shy' });
    const res = await s.c.post('/api/complaints', { ...BOARDS.complaints, anonymous: true });
    assert.equal(res.data.posted_by, 'Anonymous');
    const other = await signUp(srv.base);
    const list = await other.c.get('/api/complaints');
    const seen = list.data.find((r) => r.id === res.data.id);
    assert.equal(seen.posted_by, 'Anonymous');
    assert.equal(seen.user_id, undefined);
    assert.equal(seen.is_mine, false);
  });
});

describe('deletes check ownership on the server', () => {
  test('a student sending userRole=admin cannot delete another student\'s post', async () => {
    const owner = await signUp(srv.base);
    const attacker = await signUp(srv.base);
    for (const board of ['complaints', 'marketplace', 'blood-donation', 'lost-found', 'animal-welfare', 'faculty-suggestions', 'bicycles']) {
      const post = await owner.c.post(`/api/${board}`, BOARDS[board]);
      const res = await attacker.c.del(`/api/${board}/${post.data.id}`, { userId: owner.user.id, userRole: 'admin' });
      assert.equal(res.status, 403, `${board} answered ${res.status}`);
      const list = await owner.c.get(`/api/${board}`);
      assert.ok(list.data.some((r) => r.id === post.data.id), `${board} row was removed`);
    }
  });

  test('deletes without a session get 401', async () => {
    const anon = client(srv.base);
    for (const board of ['notices', 'lost-found', 'animal-welfare', 'faculty-suggestions', 'bicycles']) {
      assert.equal((await anon.del(`/api/${board}/anything`)).status, 401, board);
    }
  });

  test('owners can delete their own posts', async () => {
    const owner = await signUp(srv.base);
    const post = await owner.c.post('/api/marketplace', BOARDS.marketplace);
    assert.equal((await owner.c.del(`/api/marketplace/${post.data.id}`)).status, 200);
  });
});

describe('notices are admin-only and soft-deleted', () => {
  test('students cannot post or delete notices; admins can, and can restore', async () => {
    const student = await signUp(srv.base);
    const admin = await signUp(srv.base);
    await makeAdmin(pool, admin.user.id);
    const notice = { title: 'Exam routine', description: 'Published on the board', category: 'academic' };

    assert.equal((await student.c.post('/api/notices', notice)).status, 403);
    const created = await admin.c.post('/api/notices', notice);
    assert.equal(created.status, 201);

    assert.equal((await student.c.del(`/api/notices/${created.data.id}`)).status, 403);
    assert.equal((await admin.c.del(`/api/notices/${created.data.id}`)).status, 200);
    const row = await pool.query('SELECT deleted_at FROM notices WHERE id = $1', [created.data.id]);
    assert.ok(row.rows[0].deleted_at, 'notice should be soft-deleted');
    assert.ok(!(await student.c.get('/api/notices')).data.some((n) => n.id === created.data.id));

    const removed = await admin.c.get('/api/admin/removed');
    assert.ok(removed.data.some((r) => r.id === created.data.id));
    assert.equal((await admin.c.post(`/api/notices/${created.data.id}/restore`)).status, 200);
    assert.ok((await student.c.get('/api/notices')).data.some((n) => n.id === created.data.id));
  });
});

describe('university scope', () => {
  test('students only see posts from their own university', async () => {
    const buet = await signUp(srv.base);
    const du = await signUp(srv.base, { university: 'University of Dhaka', domain: 'du.ac.bd' });
    const post = await buet.c.post('/api/lost-found', BOARDS['lost-found']);
    assert.ok((await buet.c.get('/api/lost-found')).data.some((r) => r.id === post.data.id));
    assert.ok(!(await du.c.get('/api/lost-found')).data.some((r) => r.id === post.data.id));
    assert.equal((await du.c.del(`/api/lost-found/${post.data.id}`)).status, 404);
  });

  test('lists are paginated', async () => {
    const s = await signUp(srv.base);
    for (let i = 0; i < 3; i += 1) await s.c.post('/api/animal-welfare', BOARDS['animal-welfare']);
    const first = await s.c.get('/api/animal-welfare?limit=2');
    assert.equal(first.data.length, 2);
    const next = await s.c.get(`/api/animal-welfare?limit=2&before=${encodeURIComponent(first.data[1].created_at)}`);
    assert.ok(next.data.length >= 1);
    assert.ok(!next.data.some((r) => first.data.some((f) => f.id === r.id)));
  });
});

describe('student directory', () => {
  test('requires a session, stays within the university, and hides contacts unless opted in', async () => {
    assert.equal((await client(srv.base).get('/api/students')).status, 401);
    assert.equal((await client(srv.base).get('/api/auth/users')).status, 401);
    const viewer = await signUp(srv.base);
    const hidden = await signUp(srv.base, { name: 'Hidden Contact' });
    const open = await signUp(srv.base, { name: 'Open Contact' });
    await open.c.put(`/api/auth/profile/${open.user.id}`, { showContact: true });
    const du = await signUp(srv.base, { university: 'University of Dhaka', domain: 'du.ac.bd', name: 'Dhaka Student' });

    const list = (await viewer.c.get('/api/students?limit=100')).data.users;
    const h = list.find((u) => u.id === hidden.user.id);
    const o = list.find((u) => u.id === open.user.id);
    assert.equal(h.phone, undefined);
    assert.equal(h.email, undefined);
    assert.equal(o.phone, open.user.phone);
    assert.ok(!list.some((u) => u.id === du.user.id), 'other university leaked into the directory');
  });
});

describe('passwords and sessions', () => {
  test('every stored password is a bcrypt hash', async () => {
    await signUp(srv.base);
    const { rows } = await pool.query("SELECT count(*)::int AS n FROM users WHERE password_hash NOT LIKE '$2%'");
    assert.equal(rows[0].n, 0);
  });

  test('the session lives in an HttpOnly cookie and never in the response body', async () => {
    const c = client(srv.base);
    const res = await c.post('/api/auth/register', {
      name: 'Cookie', email: `cookie-${Date.now()}@buet.ac.bd`, password: 'Passw0rd!x', phone: '01711111111',
      department: 'EEE', universityName: 'BUET', homeDistrict: 'Khulna', currentResidence: 'Titumir Hall',
    });
    assert.equal(res.data.token, undefined);
    const setCookie = res.headers.get('set-cookie');
    assert.match(setCookie, /csb_session=/);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
  });

  test('logout revokes the session', async () => {
    const s = await signUp(srv.base);
    const cookie = s.c.cookie;
    assert.equal((await s.c.post('/api/auth/logout')).status, 200);
    const reuse = client(srv.base);
    reuse.cookie = cookie;
    assert.equal((await reuse.get('/api/auth/verify')).status, 401);
  });

  test('sessions survive a server restart', async () => {
    const s = await signUp(srv.base);
    const second = await startServer(pool);
    const c = client(second.base);
    c.cookie = s.c.cookie;
    assert.equal((await c.get('/api/auth/verify')).status, 200);
    await second.close();
  });

  test('change-password uses the session, ignores userId in the body, and ends other sessions', async () => {
    assert.equal((await client(srv.base).post('/api/auth/change-password', { oldPassword: 'x', newPassword: 'Newpass1!x' })).status, 401);
    const victim = await signUp(srv.base);
    const attacker = await signUp(srv.base);
    const res = await attacker.c.post('/api/auth/change-password', {
      userId: victim.user.id, oldPassword: attacker.password, newPassword: 'Changed1!pass',
    });
    assert.equal(res.status, 200);
    // the attacker changed their own password, not the victim's
    const login = await client(srv.base).post('/api/auth/login', { email: victim.email, password: victim.password });
    assert.equal(login.status, 200);

    const phone = client(srv.base);
    await phone.post('/api/auth/login', { email: victim.email, password: victim.password });
    await victim.c.post('/api/auth/change-password', { oldPassword: victim.password, newPassword: 'Another1!pass' });
    assert.equal((await phone.get('/api/auth/verify')).status, 401, 'other sessions should be revoked');
    assert.equal((await victim.c.get('/api/auth/verify')).status, 200, 'current session stays');
  });

  test('sign-up needs a university email', async () => {
    const res = await client(srv.base).post('/api/auth/register', {
      name: 'Gmail', email: `x${Date.now()}@gmail.com`, password: 'Passw0rd!x', phone: '01722222222',
      department: 'ME', universityName: 'BUET', homeDistrict: 'Sylhet', currentResidence: 'Hall',
    });
    assert.equal(res.status, 400);
  });
});

describe('hardening', () => {
  test('state-changing requests from a foreign origin are refused', async () => {
    const s = await signUp(srv.base);
    const res = await s.c.post('/api/complaints', BOARDS.complaints, { Origin: 'https://evil.example' });
    assert.equal(res.status, 403);
  });

  test('only allowed origins get CORS headers', async () => {
    const anon = client(srv.base);
    const evil = await anon.get('/api/universities', { Origin: 'https://evil.example' });
    assert.equal(evil.headers.get('access-control-allow-origin'), null);
    const good = await anon.get('/api/universities', { Origin: 'https://allowed.example' });
    assert.equal(good.headers.get('access-control-allow-origin'), 'https://allowed.example');
  });

  test('security headers are set', async () => {
    const res = await client(srv.base).get('/api/health');
    assert.ok(res.headers.get('content-security-policy'));
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  test('bodies over 50 kB are refused', async () => {
    const s = await signUp(srv.base);
    const res = await s.c.post('/api/complaints', { ...BOARDS.complaints, description: 'x'.repeat(60_000) });
    assert.equal(res.status, 413);
  });

  test('database errors reach the client as a generic message with a request id', async () => {
    const failing = { query: async () => { throw new Error('relation "secret_table" does not exist at SELECT ...'); } };
    const broken = await startServer(failing);
    const res = await client(broken.base).get('/api/universities');
    assert.equal(res.status, 500);
    assert.equal(res.data.error, 'Something went wrong');
    assert.ok(res.data.requestId);
    assert.ok(!JSON.stringify(res.data).includes('secret_table'));
    await broken.close();
  });

  test('ids are random UUID-based, not built from Math.random or the clock', async () => {
    const s = await signUp(srv.base);
    assert.match(s.user.id, /^id_[0-9a-f]{32}$/);
  });
});

describe('lend and borrow still works', () => {
  test('list, request, approve, return', async () => {
    const lender = await signUp(srv.base);
    const borrower = await signUp(srv.base);
    const item = await lender.c.post('/api/lend-borrow/items', {
      title: 'Calculator', description: 'fx-991', category: 'Electronics', itemCondition: 'Good', handoffLocation: 'ECE',
    });
    assert.equal(item.status, 201);
    const req = await borrower.c.post(`/api/lend-borrow/items/${item.data.id}/requests`, { message: 'For the exam' });
    assert.equal(req.status, 201);
    assert.equal((await borrower.c.patch(`/api/lend-borrow/requests/${req.data.id}`, { action: 'approve' })).status, 403);
    assert.equal((await lender.c.patch(`/api/lend-borrow/requests/${req.data.id}`, { action: 'approve' })).data.status, 'approved');
    assert.equal((await lender.c.patch(`/api/lend-borrow/requests/${req.data.id}`, { action: 'return' })).data.status, 'returned');
  });
});
