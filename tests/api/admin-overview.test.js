// Admin overview: the figures behind the charts on /admin.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { newPool, resetDatabase, startServer, signUp, makeAdmin } from './helpers.js';

const pool = newPool();
let srv;
before(async () => { await resetDatabase(pool); srv = await startServer(pool); });
after(async () => { await srv.close(); await pool.end(); });

const listing = { title: 'Calculator', description: 'fx-991ES, works fine', price: 900, category: 'Electronics' };

test('only admins can read the overview', async () => {
  const s = await signUp(srv.base);
  assert.equal((await s.c.get('/api/admin/overview')).status, 403);
});

test('rejects ranges other than 3, 6 or 12 months', async () => {
  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  assert.equal((await admin.c.get('/api/admin/overview?months=5')).status, 400);
});

test('counts sign-ups, posts, boards and weekdays for the range', async () => {
  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  const seller = await signUp(srv.base);
  const reporter = await signUp(srv.base);
  const item = (await seller.c.post('/api/marketplace', listing)).data;
  await seller.c.post('/api/marketplace', { ...listing, title: 'Drafter' });
  await reporter.c.post('/api/reports', { board: 'marketplace', row_id: item.id, reason: 'spam' });

  // A post from last year falls in the previous period of a 12-month view.
  await pool.query(
    `INSERT INTO marketplace (title, description, price, seller, phone, user_id, university_id, created_at)
     SELECT 'Old', 'Old', 10, name, '01700000000', id, university_id, now() - interval '13 months' FROM users WHERE id = $1`,
    [seller.user.id]);

  for (const months of [3, 6, 12]) {
    const res = await admin.c.get(`/api/admin/overview?months=${months}`);
    assert.equal(res.status, 200);
    assert.equal(res.data.months, months);
    assert.equal(res.data.series.length, months);
    assert.equal(res.data.weekdays.length, 7);
  }

  const o = (await admin.c.get('/api/admin/overview')).data;
  assert.equal(o.kpis.posts.value, 2);
  assert.equal(o.kpis.posts.previous, 1);
  assert.equal(o.kpis.activePosters.value, 1);
  assert.ok(o.kpis.students.value >= 3);
  assert.equal(o.kpis.reports.open, 1);
  assert.equal(o.series.at(-1).posts, 2);
  assert.equal(o.weekdays.reduce((n, d) => n + d.posts, 0), 2);

  const market = o.boards.find((b) => b.board === 'marketplace');
  assert.equal(market.posts, 2);
  assert.equal(market.openReports, 1);
  assert.equal(market.spark.length, 12);
  assert.equal(o.boards[0].board, 'marketplace');
  assert.ok(o.boards.some((b) => b.board === 'lending_items'));
});

test('another university is not counted', async () => {
  const admin = await signUp(srv.base);
  await makeAdmin(pool, admin.user.id);
  await pool.query(`UPDATE users SET university_id = 'du' WHERE id = $1`, [admin.user.id]);
  const o = (await admin.c.get('/api/admin/overview')).data;
  assert.equal(o.kpis.posts.value, 0);
});
