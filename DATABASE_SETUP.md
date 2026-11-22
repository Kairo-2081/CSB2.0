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

## Supabase (or any hosted Postgres)

Use the project's connection string (Settings → Database) as `DATABASE_URL`.
The server applies `schema.sql` on start. You can also paste the file into the
SQL editor and run it; it is safe to run more than once.

`pgcrypto` must be available. It is on Supabase and in every standard
PostgreSQL install.

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
