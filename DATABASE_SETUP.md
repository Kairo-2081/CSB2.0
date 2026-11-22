# Database setup

CSB 2.0 runs on PostgreSQL 14 or newer. The whole database — tables, indexes,
triggers, seed rows and every PL/pgSQL function the API calls — is in one
file: [`schema.sql`](schema.sql).

## Local PostgreSQL

```bash
createdb csb2
cp .env.local.example .env.local     # set DATABASE_URL
npm run dev                          # runs schema.sql, then starts the API
```

## Neon (production)

1. In the Neon console, create a project (PostgreSQL 16 or 17, region close to
   Bangladesh such as Singapore).
2. Click **Connect** and copy the connection string. It ends in
   `?sslmode=require`; keep that.
3. Put it in Render as `DATABASE_URL`. The server runs `schema.sql` on start,
   which creates every table and function. `pgcrypto` is available on Neon.

Neon's free plan pauses an idle database and wakes it on the next request, so
the first request after a quiet spell is slower.

## Render

`render.yaml` creates one web service that serves the site and the API.

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Environment: `DATABASE_URL` = the Neon connection string.
- Do not set `VITE_API_URL`. The built site calls `/api` on its own domain.

## Other hosted Postgres

Any PostgreSQL 14+ works. If the connection string has no `sslmode=require`
but the host needs TLS, also set `DATABASE_SSL=true`.

## Changing the schema

Edit `schema.sql` only. Do not write SQL in `server.js`; add a function to
`schema.sql` and call it.

- New table, index or function: restart the server.
- Changed a column, or a function's arguments or return type: run
  `npm run db:reset` locally (drops all data), or write the `ALTER` /
  `DROP FUNCTION` yourself for a database whose data you need to keep.

## First admin

No accounts are seeded. Register normally, then:

```sql
UPDATE users SET role = 'admin' WHERE lower(email) = lower('<their email>');
```
