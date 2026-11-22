// Runs in its own process with only two modules switched on.
process.env.MODULES = 'notices,lost-found';
const { test, before, after } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { newPool, resetDatabase, startServer, client, signUp } = await import('./helpers.js');

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

test('switched-off modules answer 404 and are not listed', async () => {
  const listed = await client(srv.base).get('/api/modules');
  assert.deepEqual(listed.data.modules, ['notices', 'lost-found']);
  const s = await signUp(srv.base);
  assert.equal((await s.c.get('/api/lost-found')).status, 200);
  assert.equal((await s.c.get('/api/marketplace')).status, 404);
  assert.equal((await s.c.post('/api/blood-donation', {})).status, 404);
  assert.equal((await s.c.get('/api/students')).status, 404);
});
