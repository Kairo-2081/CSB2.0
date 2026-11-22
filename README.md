# CSB 2.0

Campus services for BUET students: notices, lost and found, lending and borrowing, a marketplace, complaints, bicycles, blood donation, animal welfare, faculty suggestions and a student directory, in one place. It opens at BUET first; other Bangladeshi universities come later.

Live: <https://csb2-sg-yhv2.onrender.com> · Staging: <https://csb2-staging.onrender.com>

## How it fits together

| Part | What it is |
|---|---|
| `src/` | React 18 + Vite + TypeScript + Tailwind. Pages load on demand. |
| `server.js`, `server/` | Express API. Checks the session, validates the body (zod), calls one database function, returns its JSON. |
| `schema.sql` | The whole database: tables, versioned migrations, seed data and every PL/pgSQL function the API calls. Access rules live here. |
| `tests/api`, `tests/e2e` | Node test runner against a real PostgreSQL; Playwright smoke test in a browser. |
| `.github/workflows` | CI, deploy, nightly encrypted backup with a restore check, uptime check. |

Production runs on Render (Singapore) with PostgreSQL on Neon (Singapore).

## Run it locally

You need Node 22 and PostgreSQL 14 or newer.

```bash
npm ci
createdb csb2
cp .env.local.example .env.local     # set DATABASE_URL
npm run dev                          # API on :3001, site on :8080 (Vite proxies /api)
```

The server applies `schema.sql` on every start. It is safe to re-run.

Register with an `@buet.ac.bd` address (subdomains such as `ugrad.cse.buet.ac.bd` count). No accounts are seeded. To make yourself an administrator, either set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first start (the account must change its password at first sign-in), or run:

```sql
UPDATE users SET role = 'admin' WHERE lower(email) = lower('you@ugrad.cse.buet.ac.bd');
```

`npm run db:reset` drops and rebuilds your local database. It refuses hosted databases.

## Tests

```bash
createdb csb2_test
TEST_DATABASE_URL=postgresql://localhost/csb2_test npm test       # API access rules (wipes that database)

npm run build && DATABASE_URL=postgresql://localhost/csb2_e2e PORT=3001 node server.js &
npm run test:e2e                                                  # browser smoke test
```

CI runs lint (zero warnings), the type check, the build, `npm audit` (fails on high), a secret scan, both test suites, and then deploys.

## Security model

- **Sessions** are an HttpOnly, SameSite=Lax cookie (Secure in production). Only a SHA-256 of the token is stored; sessions expire after 7 days and are revoked on sign-out and on password change.
- **Default deny**: every `/api` route needs a session except those in `PUBLIC_ROUTES` (`server/app.js`). A test walks the router to prove it.
- **The database decides**: each function takes the signed-in user's id from the session, never from the request body, and checks university scope, ownership and role itself.
- **Passwords** are bcrypt hashes (`pgcrypto`, cost 12).
- **Hardening**: helmet with a strict CSP, a CORS allowlist, an Origin check on writes, a 50 kB body limit, rate limits (8 sign-in attempts per 15 minutes, 10 sign-ups per hour, 300 requests per minute), and generic 500 errors with a request id.
- **Moderation**: students can report posts; administrators review them, remove or keep them, and can restore removed notices and complaints.
- **Privacy**: the directory shows phone and email only when a student opts in; sign-up and blood-donor listings require consent; students can download or delete their data. See `/privacy`.

## Configuration

All settings are environment variables (`server/config.js`). The useful ones:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://localhost:5432/csb2` | PostgreSQL connection string |
| `NODE_ENV` | | `production` turns on Secure cookies and trusts one proxy |
| `OPEN_UNIVERSITIES` | `buet` | University slugs that may register |
| `ALLOWED_EMAIL_DOMAINS` | `buet.ac.bd` | Email domains allowed at sign-up |
| `MODULES` | all ten | Comma-separated modules to switch on |
| `SMTP_URL`, `MAIL_FROM` | | Outgoing mail; setting `SMTP_URL` turns on email verification |
| `REQUIRE_EMAIL_VERIFICATION` | on when `SMTP_URL` is set | Override the above |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | Create the first administrator once |
| `CORS_ORIGINS` | none in production | Other origins allowed to call the API |
| `DATABASE_SSL` | | `true` to force TLS when the URL lacks `sslmode` |
| `VITE_PRIVACY_CONTACT` | | Contact address shown on the privacy page (build time) |

## Changing the database

Edit `schema.sql` only. To change an existing table, add a numbered migration block in section 3 and never edit an applied one. Functions are dropped and recreated on every start, so their signatures can change freely. Add a test in `tests/api` for every new access rule.

## More

- [`docs/runbook.md`](docs/runbook.md): deploys, rollback, backups and restore, incidents.
- [`LAUNCH_CHECKLIST.md`](LAUNCH_CHECKLIST.md): what must be true before the pilot and the campus launch.
- [`DESIGN.md`](DESIGN.md): the visual system. [`PRODUCT.md`](PRODUCT.md): what the product promises.

## Repositories

`Kairo-2081/CSB2.0` is where development happens; `unthinkingFool/CSB2.0` is the upstream it was forked from and merges its `main` periodically. Open pull requests against `Kairo-2081/CSB2.0`.
