// Runs in its own process so it sees the production login limit (8 per 15 min).
process.env.RATE_LIMIT_LOGIN = '8';
const { test, before, after } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { newPool, resetDatabase, startServer, client } = await import('./helpers.js');

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

test('the ninth wrong login in 15 minutes gets 429', async () => {
  const c = client(srv.base);
  const statuses = [];
  for (let i = 0; i < 9; i += 1) {
    statuses.push((await c.post('/api/auth/login', { email: 'nobody@buet.ac.bd', password: 'wrong' })).status);
  }
  assert.deepEqual(statuses.slice(0, 8), Array(8).fill(401));
  assert.equal(statuses[8], 429);
});
