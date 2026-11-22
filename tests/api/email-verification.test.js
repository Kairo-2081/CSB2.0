// Runs in its own process with mail switched on (messages kept in memory).
process.env.SMTP_URL = 'json://outbox';
const { test, before, after } = await import('node:test');
const assert = (await import('node:assert/strict')).default;
const { newPool, resetDatabase, startServer, client, signUp } = await import('./helpers.js');
const { outbox } = await import('../../server/mailer.js');

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

const codeFor = async (email) => {
  for (let i = 0; i < 50; i += 1) {
    const msg = [...outbox].reverse().find((m) => m.to?.[0]?.address === email);
    if (msg) return msg.subject.slice(0, 6);
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error('no email sent');
};

test('verification is announced, unverified accounts cannot post, and the emailed code unlocks posting', async () => {
  assert.equal((await client(srv.base).get('/api/modules')).data.emailVerification, 'required');
  const s = await signUp(srv.base);
  assert.equal(s.user.emailVerified, false);
  const post = { title: 'Lost keys', description: 'Three keys on a ring', item_type: 'lost', location: 'Cafeteria' };
  assert.equal((await s.c.post('/api/lost-found', post)).status, 403);
  assert.equal((await s.c.get('/api/lost-found')).status, 200, 'reading still works');

  const code = await codeFor(s.email);
  assert.match(code, /^\d{6}$/);
  assert.equal((await s.c.post('/api/auth/email/verify', { code: code === '000000' ? '111111' : '000000' })).status, 400);
  const ok = await s.c.post('/api/auth/email/verify', { code });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.emailVerified, true);
  assert.equal((await s.c.post('/api/lost-found', post)).status, 201);
});

test('a code stops working after five wrong tries', async () => {
  const s = await signUp(srv.base);
  const code = await codeFor(s.email);
  const wrong = code === '123456' ? '654321' : '123456';
  for (let i = 0; i < 5; i += 1) await s.c.post('/api/auth/email/verify', { code: wrong });
  assert.equal((await s.c.post('/api/auth/email/verify', { code })).status, 429);
});

test('codes cannot be requested more than once a minute', async () => {
  const s = await signUp(srv.base);
  await codeFor(s.email);
  assert.equal((await s.c.post('/api/auth/email/send')).status, 429);
});
