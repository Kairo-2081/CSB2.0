# Database setup

The whole database is defined in one file: [`schema.sql`](schema.sql).

1. `npm run server` (or `npm run dev`). The server creates `campus-hub.db` if it
   is missing and runs `schema.sql` against it.
2. That's it. Tables, indexes and the university catalog are all in the file.

## Changing the schema

Edit `schema.sql` only. Do not add SQL definitions to `server.js` or anywhere
else.

Re-running the file creates missing tables but does not alter existing ones.
After you change a column, delete your local `campus-hub.db` and restart.

## First admin

No accounts are seeded. Register normally, then:

```sql
UPDATE users SET role = 'admin' WHERE email = '<their email>';
```
