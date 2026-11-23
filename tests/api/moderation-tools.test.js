// Auto-hide after three reports, suspensions and the moderation log.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, signUp, makeAdmin, client } from './helpers.js';

const login = (base, email, password) => client(base).post('/api/auth/login', { email, password });

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

const listing = { title: 'Totally real iPhone', description: 'Send money first', price: 500, category: 'Electronics' };
const ids = (res) => res.data.map((r) => r.id);

test('three reports hide a post from other students until an admin decides', async () => {
  const seller = await signUp(srv.base);
  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  const [a, b, c, viewer] = await Promise.all([signUp(srv.base), signUp(srv.base), signUp(srv.base), signUp(srv.base)]);
  const item = (await seller.c.post('/api/marketplace', listing)).data;

  await a.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam' });
  await b.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'false' });
  assert.ok(ids(await viewer.c.get('/api/marketplace')).includes(item.id), 'still visible after two');

  await c.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam' });
  assert.ok(!ids(await viewer.c.get('/api/marketplace')).includes(item.id), 'hidden after three');
  const own = (await seller.c.get('/api/marketplace')).data.find((r) => r.id === item.id);
  assert.equal(own?.hidden, true, 'the owner still sees it, marked hidden');
  const queued = (await admin.c.get('/api/admin/reports')).data.find((r) => r.row_id === item.id);
  assert.equal(queued.hidden, true);
  assert.equal(queued.owner_id, seller.user.id);

  // Keep: the post comes back.
  await admin.c.post('/api/admin/reports/resolve', { board: 'marketplace', row_id: item.id, action: 'dismiss' });
  assert.ok(ids(await viewer.c.get('/api/marketplace')).includes(item.id), 'visible again after Keep');

  const log = (await admin.c.get('/api/admin/moderation-log')).data;
  assert.deepEqual(log.map((l) => l.action).slice(0, 2), ['dismiss', 'auto_hide']);
  assert.equal(log.find((l) => l.action === 'auto_hide').actor, 'Automatic');
});

test('a suspended student is signed out, cannot sign in, and can be restored', async () => {
  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  const student = await signUp(srv.base);

  assert.equal((await admin.c.post(`/api/admin/users/${student.user.id}/suspend`, { reason: 'x' })).status, 400, 'reason required');
  assert.equal((await admin.c.post(`/api/admin/users/${student.user.id}/suspend`, { reason: 'Scam listings' })).status, 200);
  assert.equal((await student.c.get('/api/notices')).status, 401, 'existing session revoked');
  const again = await login(srv.base, student.email, student.password);
  assert.equal(again.status, 403);
  assert.match(again.data.error, /suspended/);

  const list = (await admin.c.get('/api/admin/suspended')).data;
  assert.equal(list[0].id, student.user.id);
  assert.equal(list[0].reason, 'Scam listings');

  assert.equal((await admin.c.post(`/api/admin/users/${student.user.id}/unsuspend`)).status, 200);
  assert.equal((await login(srv.base, student.email, student.password)).status, 200);

  const actions = (await admin.c.get('/api/admin/moderation-log')).data.map((l) => l.action);
  assert.deepEqual(actions.slice(0, 2), ['unsuspend', 'suspend']);
});

test('admins cannot be suspended, and students cannot suspend', async () => {
  const admin = await signUp(srv.base);
  const other = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  await makeAdmin(pool, other.user.id);
  assert.equal((await admin.c.post(`/api/admin/users/${other.user.id}/suspend`, { reason: 'Testing' })).status, 400);
  const student = await signUp(srv.base);
  assert.equal((await student.c.post(`/api/admin/users/${admin.user.id}/suspend`, { reason: 'Testing' })).status, 403);
});
