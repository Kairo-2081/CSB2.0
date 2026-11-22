// Phase 6: privacy consent, reports and moderation, export and account deletion.
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, client, signUp, makeAdmin } from './helpers.js';

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

const listing = { title: 'Calculator', description: 'fx-991ES, works fine', price: 900, category: 'Electronics' };

describe('privacy consent', () => {
  test('sign-up without accepting the privacy notice is refused', async () => {
    const res = await client(srv.base).post('/api/auth/register', {
      name: 'No Consent', email: `nc${Date.now()}@buet.ac.bd`, password: 'Passw0rd!x', phone: '01733333333',
      department: 'CSE', universityName: 'BUET', homeDistrict: 'Dhaka', currentResidence: 'Hall',
    });
    assert.equal(res.status, 400);
  });

  test('sign-up records when the notice was accepted', async () => {
    const s = await signUp(srv.base);
    assert.equal(s.user.privacyAccepted, true);
  });

  test('blood donors must agree before listing', async () => {
    const s = await signUp(srv.base);
    const res = await s.c.post('/api/blood-donation', { blood_type: 'A+', contact_number: '01700000000', location: 'Hall' });
    assert.equal(res.status, 400);
  });
});

describe('reports and moderation', () => {
  test('students report once, not their own posts; admins dismiss or remove', async () => {
    const seller = await signUp(srv.base);
    const reporter = await signUp(srv.base);
    const another = await signUp(srv.base);
    const admin = await signUp(srv.base);
    await makeAdmin(pool, admin.user.id);
    const item = (await seller.c.post('/api/marketplace', listing)).data;

    assert.equal((await seller.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam' })).status, 400);
    assert.equal((await reporter.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam', details: 'Posted ten times' })).status, 201);
    assert.equal((await reporter.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam' })).status, 409);
    assert.equal((await another.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'false' })).status, 201);
    assert.equal((await reporter.c.post('/api/reports', { board: 'marketplace', row_id: 'missing', reason: 'spam' })).status, 404);

    assert.equal((await reporter.c.get('/api/admin/reports')).status, 403);
    const queue = (await admin.c.get('/api/admin/reports')).data;
    const entry = queue.find((q) => q.row_id === item.id);
    assert.equal(entry.reports, 2);
    assert.equal(entry.label, 'Calculator');
    assert.deepEqual(entry.details, ['Posted ten times']);

    const resolved = await admin.c.post('/api/admin/reports/resolve', { board: 'marketplace', row_id: item.id, action: 'remove' });
    assert.equal(resolved.status, 200);
    assert.ok(!(await seller.c.get('/api/marketplace')).data.some((r) => r.id === item.id));
    assert.ok(!(await admin.c.get('/api/admin/reports')).data.some((q) => q.row_id === item.id));
  });

  test('dismissing keeps the post', async () => {
    const seller = await signUp(srv.base);
    const reporter = await signUp(srv.base);
    const admin = await signUp(srv.base);
    await makeAdmin(pool, admin.user.id);
    const item = (await seller.c.post('/api/marketplace', listing)).data;
    await reporter.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'other' });
    await admin.c.post('/api/admin/reports/resolve', { board: 'marketplace', row_id: item.id, action: 'dismiss' });
    assert.ok((await seller.c.get('/api/marketplace')).data.some((r) => r.id === item.id));
  });
});

describe('your data', () => {
  test('export contains your profile and posts but no password', async () => {
    const s = await signUp(srv.base, { name: 'Exporter' });
    await s.c.post('/api/marketplace', listing);
    const res = await s.c.get('/api/account/export');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-disposition'), /attachment/);
    assert.equal(res.data.account.name, 'Exporter');
    assert.equal(res.data.posts.marketplace.length, 1);
    assert.ok(!JSON.stringify(res.data).includes('$2'), 'password hash leaked into the export');
  });

  test('deleting the account needs the password and removes everything posted', async () => {
    const s = await signUp(srv.base);
    const post = (await s.c.post('/api/marketplace', listing)).data;
    assert.equal((await s.c.del('/api/account', { password: 'wrong' })).status, 401);
    assert.equal((await s.c.del('/api/account', { password: s.password })).status, 200);
    const { rows } = await pool.query('SELECT (SELECT count(*) FROM users WHERE id = $1)::int AS u, (SELECT count(*) FROM marketplace WHERE id = $2)::int AS m', [s.user.id, post.id]);
    assert.deepEqual(rows[0], { u: 0, m: 0 });
    assert.equal((await client(srv.base).post('/api/auth/login', { email: s.email, password: s.password })).status, 401);
  });

  test('the only admin cannot delete their account', async () => {
    await pool.query("UPDATE users SET role = 'student' WHERE role = 'admin'");
    const admin = await signUp(srv.base);
    await makeAdmin(pool, admin.user.id);
    assert.equal((await admin.c.del('/api/account', { password: admin.password })).status, 409);
  });
});
