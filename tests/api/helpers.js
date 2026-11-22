// Test harness: a fresh PostgreSQL schema per run and the real Express app on
// a random port. Needs TEST_DATABASE_URL (a database the tests may wipe).
import pg from 'pg';

export const TEST_DB = process.env.TEST_DATABASE_URL;
if (!TEST_DB) {
  throw new Error('Set TEST_DATABASE_URL to a throwaway PostgreSQL database. The tests drop everything in it.');
}

// Settings must be in place before server/config.js is first imported.
process.env.OPEN_UNIVERSITIES ??= 'buet,du';
process.env.ALLOWED_EMAIL_DOMAINS ??= 'buet.ac.bd,du.ac.bd';
process.env.CORS_ORIGINS ??= 'https://allowed.example';
process.env.RATE_LIMIT_LOGIN ??= '1000';
process.env.RATE_LIMIT_REGISTER ??= '1000';
process.env.RATE_LIMIT_GENERAL ??= '100000';

const { createApp, initializeDatabase } = await import('../../server/app.js');

export async function resetDatabase(pool) {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await initializeDatabase(pool);
}

export async function startServer(pool, options = {}) {
  const { app } = createApp({ pool, log: { info() {}, error() {} }, ...options });
  app.locals.setDbReady(true);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { app, server, base, close: () => new Promise((r) => server.close(r)) };
}

export function newPool() {
  return new pg.Pool({ connectionString: TEST_DB, max: 5 });
}

// A tiny client that keeps the session cookie like a browser would.
export function client(base) {
  let cookie = null;
  async function request(method, path, body, headers = {}) {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) {
      const value = set.split(';')[0];
      cookie = value.endsWith('=') ? null : value;
    }
    let data = null;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, data, headers: res.headers };
  }
  return {
    get: (p, h) => request('GET', p, undefined, h),
    post: (p, b, h) => request('POST', p, b ?? {}, h),
    put: (p, b, h) => request('PUT', p, b ?? {}, h),
    patch: (p, b, h) => request('PATCH', p, b ?? {}, h),
    del: (p, b, h) => request('DELETE', p, b, h),
    get cookie() { return cookie; },
    set cookie(v) { cookie = v; },
  };
}

let counter = 0;
export async function signUp(base, { university = 'BUET', domain = 'buet.ac.bd', name } = {}) {
  counter += 1;
  const c = client(base);
  const email = `student${counter}-${Date.now()}@${domain}`;
  const res = await c.post('/api/auth/register', {
    name: name ?? `Student ${counter}`,
    email,
    password: 'Passw0rd!x',
    phone: `0170000${String(counter).padStart(4, '0')}`,
    department: 'CSE',
    universityName: university,
    homeDistrict: 'Dhaka',
    currentResidence: 'Ahsanullah Hall',
  });
  if (res.status !== 201) throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.data)}`);
  return { c, user: res.data.user, email, password: 'Passw0rd!x' };
}

export async function makeAdmin(pool, userId) {
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);
}
