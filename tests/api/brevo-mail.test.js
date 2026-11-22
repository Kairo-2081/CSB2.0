// Runs in its own process with a Brevo key set and Brevo's API replaced by a stub.
process.env.BREVO_API_KEY = 'test-key';
process.env.MAIL_FROM = 'CSB 2.0 <csb2.buet@gmail.com>';
const { test } = await import('node:test');
const assert = (await import('node:assert/strict')).default;

const realFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://api.brevo.com/')) {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ messageId: '<x@brevo>' }), { status: 201 });
  }
  return realFetch(url, init);
};
const { sendVerificationCode, mailEnabled, parseAddress } = await import('../../server/mailer.js');
const { config } = await import('../../server/config.js');

test('a Brevo key turns mail and verification on', () => {
  assert.equal(mailEnabled, true);
  assert.equal(config.requireEmailVerification, true);
});

test('codes go to Brevo over HTTPS with the configured sender', async () => {
  await sendVerificationCode({ email: 'student@ugrad.cse.buet.ac.bd', name: 'Nadia', code: '482913' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(calls[0].init.headers['api-key'], 'test-key');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.sender, { name: 'CSB 2.0', email: 'csb2.buet@gmail.com' });
  assert.deepEqual(body.to, [{ email: 'student@ugrad.cse.buet.ac.bd', name: 'Nadia' }]);
  assert.equal(body.subject, '482913 is your CSB 2.0 code');
  assert.match(body.textContent, /482913/);
});

test('a Brevo error is reported with its reason', async () => {
  globalThis.fetch = async () => new Response('{"code":"unauthorized","message":"Key not found"}', { status: 401 });
  await assert.rejects(sendVerificationCode({ email: 'a@buet.ac.bd', name: 'A', code: '000000' }), /Brevo refused the email \(401\).*Key not found/);
});

test('sender addresses parse with or without a name', () => {
  assert.deepEqual(parseAddress('CSB 2.0 <a@b.c>'), { name: 'CSB 2.0', email: 'a@b.c' });
  assert.deepEqual(parseAddress('a@b.c'), { email: 'a@b.c' });
});
