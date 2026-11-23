// Browser error reports: accepted without a session, validated, logged, rate limited.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, signUp } from './helpers.js';

const pool = newPool();
let srv;
const lines = [];
before(async () => {
  await resetDatabase(pool);
  srv = await startServer(pool, { log: { info() {}, error: (line) => lines.push(line), warn() {} } });
});
after(async () => { await srv.close(); await pool.end(); });

const report = { kind: 'react', message: 'Cannot read properties of undefined', stack: 'at Board', url: '/notices' };
const post = (body, headers = {}) => fetch(`${srv.base}/api/client-errors`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: srv.base, ...headers }, body: JSON.stringify(body),
});

test('a report without a session is accepted and logged', async () => {
  const res = await post(report);
  assert.equal(res.status, 204);
  const logged = lines.map((l) => JSON.parse(l)).find((l) => l.msg === 'client error');
  assert.ok(logged, 'logged as client error');
  assert.equal(logged.message, report.message);
  assert.equal(logged.url, '/notices');
  assert.equal(logged.user, undefined);
});

test('a signed-in report carries the user id', async () => {
  const s = await signUp(srv.base);
  const res = await s.c.post('/api/client-errors', { ...report, message: 'Signed-in crash' });
  assert.equal(res.status, 204);
  const logged = lines.map((l) => JSON.parse(l)).find((l) => l.message === 'Signed-in crash');
  assert.equal(logged.user, s.user.id);
});

test('invalid reports are rejected', async () => {
  assert.equal((await post({ kind: 'nope', message: 'x' })).status, 400);
  assert.equal((await post({ kind: 'error', message: 'x'.repeat(600) })).status, 400);
});
