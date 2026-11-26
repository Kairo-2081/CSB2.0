// The AI assistant, with a fake Groq: scope, what is sent to the provider,
// drafts, admin-only tools, validation and provider failures.
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, signUp, makeAdmin } from './helpers.js';

const pool = newPool();
let srv;
let script = [];     // what the fake model answers, in order
let sent = [];       // every request body the fake model received
let failWith = null; // HTTP status to fail with

const reply = (content) => ({ choices: [{ message: { role: 'assistant', content } }], usage: { total_tokens: 10 } });
const toolCall = (name, args) => ({
  choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ id: `call_${name}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }] } }],
});

async function fakeGroq(url, init) {
  sent.push(JSON.parse(init.body));
  if (failWith) return new Response('{}', { status: failWith });
  const next = script.shift() ?? reply('Done.');
  return new Response(JSON.stringify(next), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

before(async () => {
  await resetDatabase(pool);
  process.env.GROQ_API_KEY = 'test-key';
  srv = await startServer(pool, { assistantFetch: fakeGroq });
});
after(async () => { delete process.env.GROQ_API_KEY; await srv.close(); await pool.end(); });
beforeEach(() => { script = []; sent = []; failWith = null; });

const ask = (s, content) => s.c.post('/api/assistant/chat', { messages: [{ role: 'user', content }] });

test('search covers only your campus, hides contact details and hidden posts', async () => {
  const owner = await signUp(srv.base);
  const asker = await signUp(srv.base);
  const du = await signUp(srv.base, { university: 'University of Dhaka', domain: 'du.ac.bd' });
  await owner.c.post('/api/lost-found', { title: 'Lost black wallet', description: 'Near the ECE building, has my ID', item_type: 'lost', location: 'ECE building', contact_number: '01811112222' });
  await du.c.post('/api/lost-found', { title: 'Lost black wallet at DU', description: 'Curzon Hall', item_type: 'lost', location: 'Curzon Hall', contact_number: '01933334444' });

  script = [toolCall('search_posts', { query: 'black wallet' }), reply('Someone posted a lost black wallet near ECE.')];
  const res = await ask(asker, 'Did anyone lose a black wallet?');
  assert.equal(res.status, 200);
  assert.equal(res.data.reply, 'Someone posted a lost black wallet near ECE.');
  assert.deepEqual(res.data.posts.map((p) => p.post.title), ['Lost black wallet']);
  assert.equal(res.data.posts[0].path, '/lost-found');

  const toProvider = JSON.stringify(sent);
  assert.ok(!toProvider.includes('01811112222'), 'phone never sent to the provider');
  assert.ok(!toProvider.includes('Curzon'), 'other campus never sent');
  assert.ok(!toProvider.includes(owner.email), 'email never sent');
  assert.ok(!JSON.stringify(res.data).includes('01811112222'), 'phone never sent to the browser either');
  assert.ok(!toProvider.includes(owner.user.id), 'user ids never sent');
});

test('posts hidden by reports are not found by other students', async () => {
  const owner = await signUp(srv.base);
  const asker = await signUp(srv.base);
  const item = (await owner.c.post('/api/marketplace', { title: 'Suspicious phone deal', description: 'Pay first', price: 100, category: 'Electronics' })).data;
  await pool.query('UPDATE marketplace SET hidden_at = now() WHERE id = $1', [item.id]);
  script = [toolCall('search_posts', { query: 'suspicious phone deal' }), reply('Nothing found.')];
  const res = await ask(asker, 'phone deal?');
  assert.equal(res.data.posts.length, 0);
});

test('drafts come back for the student to post; nothing is posted', async () => {
  const s = await signUp(srv.base);
  const before = (await pool.query('SELECT count(*)::int AS n FROM lost_found')).rows[0].n;
  script = [
    toolCall('draft_post', { board: 'lost_found', fields: { title: 'Lost blue bottle', description: 'Left it in the library reading room', item_type: 'lost', location: 'Central Library', contact_number: '01700000000' } }),
    reply('Here is a draft. Check it and press Post.'),
  ];
  const res = await ask(s, 'I lost my blue bottle in the library');
  assert.equal(res.data.drafts.length, 1);
  assert.equal(res.data.drafts[0].board, 'lost_found');
  assert.equal(res.data.drafts[0].fields.location, 'Central Library');
  assert.equal(res.data.drafts[0].fields.contact_number, undefined, 'contact details are left to the form');
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM lost_found')).rows[0].n, before);

  script = [toolCall('draft_post', { board: 'marketplace', fields: { title: 'Calculator' } }), reply('What price?')];
  await ask(s, 'sell my calculator');
  const toolResult = sent.at(-1).messages.find((m) => m.role === 'tool');
  assert.match(toolResult.content, /Missing or invalid: .*description/);
});

test('students cannot draft notices or see the admin summary; admins can', async () => {
  const student = await signUp(srv.base);
  script = [reply('Hi')];
  await ask(student, 'hello');
  const studentTools = sent[0].tools.map((t) => t.function.name);
  assert.deepEqual(studentTools.sort(), ['draft_post', 'search_posts']);
  const draftBoards = sent[0].tools.find((t) => t.function.name === 'draft_post').function.parameters.properties.board.enum;
  assert.ok(!draftBoards.includes('notices'), 'students cannot draft notices');

  script = [toolCall('campus_summary', {}), reply('No.')];
  await ask(student, 'show me reports');
  assert.match(sent.at(-1).messages.find((m) => m.role === 'tool').content, /Only administrators/);

  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  sent = [];
  script = [toolCall('campus_summary', { months: 3 }), reply('Quiet week.')];
  const res = await ask(admin, 'How is the campus doing?');
  assert.equal(res.data.reply, 'Quiet week.');
  assert.ok(sent[0].tools.some((t) => t.function.name === 'campus_summary'));
  const summary = JSON.parse(sent[1].messages.find((m) => m.role === 'tool').content);
  assert.equal(summary.period_months, 3);
  assert.ok('open_reported_posts' in summary);
});

test('bad requests are refused and provider failures are explained', async () => {
  const s = await signUp(srv.base);
  assert.equal((await s.c.post('/api/assistant/chat', { messages: [{ role: 'assistant', content: 'hi' }] })).status, 400);
  assert.equal((await ask(s, 'x'.repeat(2001))).status, 400);
  failWith = 500;
  const res = await ask(s, 'hello');
  assert.equal(res.status, 502);
  assert.match(res.data.error, /unavailable/);
  failWith = 429;
  assert.equal((await ask(s, 'hello')).status, 503);
});

test('the assistant is off without a key', async () => {
  delete process.env.GROQ_API_KEY;
  try {
    const s = await signUp(srv.base);
    assert.equal((await ask(s, 'hello')).status, 404);
    assert.equal((await s.c.get('/api/modules')).data.assistant, 'off');
  } finally {
    process.env.GROQ_API_KEY = 'test-key';
  }
});
