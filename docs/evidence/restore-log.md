# Restore log

Each restore test: what was restored, from where, and what was checked.

## 2026-11-22 — Neon branch restore (point in time)

- **Source**: production branch `main` (Neon project `broad-butterfly-05358720`), snapshot branch
  `backup-before-migration-2` (`br-round-sun-azasn3yh`) taken at 03:59 UTC, before migration 2 ran in production.
- **Restored into**: new branch `restore-test-2026-11-22` (`br-flat-snow-azktzm4g`) at 07:19 UTC.
- **Checked** (SQL on the restored branch):

  | Check | Expected | Found |
  |---|---|---|
  | Tables in `public` | 13 (pre-migration schema) | 13 |
  | `schema_migrations` table | absent (added by migration 2) | absent |
  | Users | 2 | 2 |
  | Lost and found posts | 1 ("Book", posted under the placeholder id) | 1, "Book" |
  | Universities | 12 | 12 |

- **Result**: passed. The restored branch holds production exactly as it was before the migration.
- **Time to restore**: under a minute (branch creation is copy-on-write).

## Nightly logical backups

From the day `BACKUP_DATABASE_URL` and `BACKUP_PASSPHRASE` are set, the **Nightly backup** workflow restores every
dump into a scratch PostgreSQL 18 and records the result in its run summary. Link the first green run here.
