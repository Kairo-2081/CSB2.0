# Runbook

What to do when something needs doing or something breaks. Keep it short and true; update it when the setup changes.

## What runs where

| Thing | Where | Id / URL |
|---|---|---|
| Production site + API | Render web service `csb2-sg-yhv2`, Singapore, free plan | `srv-dc14u63l550s73de5kcg` · <https://csb2-sg-yhv2.onrender.com> |
| Staging site + API | Render web service `csb2-staging`, Singapore, free plan, tracks the `staging` branch | `srv-dc19f62fngtc73f1c1s0` · <https://csb2-staging.onrender.com> |
| Production database | Neon project "CSB 2.0", branch `main`, Singapore, PostgreSQL 18 | `broad-butterfly-05358720` |
| Staging database | Neon branch `staging` of the same project | `br-wandering-mouse-az2isn6h` |
| Code, CI, backups | GitHub `Kairo-2081/CSB2.0`, Actions | |

Free-plan facts that matter: the Render instance sleeps after ~15 idle minutes (the next visit takes 30–60 s), and Neon keeps only **6 hours** of point-in-time history. The nightly dump is the real backup.

## Deploying

1. Open a pull request. CI must be green (lint, types, build, audit, secret scan, API tests, browser test).
2. To try it first, merge or push it to `staging`; CI deploys staging when it passes.
3. Merge to `main`. CI deploys production when it passes.

The deploy step needs `RENDER_DEPLOY_HOOK_URL` and `RENDER_STAGING_DEPLOY_HOOK_URL` (Render → service → Settings → Deploy Hook). Without them, deploy by hand: Render → service → Manual Deploy → Deploy latest commit.

Every deploy runs `schema.sql` at start-up. A migration that fails stops the new instance from starting and Render keeps the old one serving.

**After a deploy**, check `GET /api/health` returns `"database":"ready"`, then sign in and open one board.

## Rolling back

- **Code**: Render → service → Events → pick the last good deploy → Rollback. Then revert the bad merge on GitHub so the next deploy does not bring it back.
- **Database**: migrations only move forward. Undo a bad one with a new migration. If data was damaged, restore (below).

## Backups and restore

**What exists**

- Neon point-in-time history: the last 6 hours, any second.
- Nightly encrypted `pg_dump` (GitHub Actions → Nightly backup), kept 30 days as workflow artifacts. Each night's dump is restored into a scratch database and checked; the run summary shows the counts. Needs secrets `BACKUP_DATABASE_URL` (production direct connection string, without `-pooler`) and `BACKUP_PASSPHRASE` (keep a copy in your password manager).
- Before risky changes, take a manual snapshot: Neon → Branches → New branch from `main`, named `backup-before-…`.

**Restore within the last 6 hours (fastest)**

1. Neon → Branches → `main` → Restore → pick the time just before the damage. Neon keeps the pre-restore state as a backup branch.
2. Check `/api/health` and a few records. No Render change is needed: the connection string stays the same.

**Restore from a nightly dump**

1. GitHub → Actions → Nightly backup → the run you want → download the `csb2-….dump.gpg` artifact.
2. `gpg -d -o csb2.dump csb2-….dump.gpg` (asks for `BACKUP_PASSPHRASE`).
3. Create an empty Neon branch, or a fresh database, and run
   `pg_restore --no-owner --no-privileges -d "<its connection string>" csb2.dump` (PostgreSQL 18 client).
4. Check it, then either point Render's `DATABASE_URL` at it, or make that branch the default in Neon.

Log every restore test in [`evidence/restore-log.md`](evidence/restore-log.md).

## When something breaks

**The site is down or very slow**

1. `curl https://csb2-sg-yhv2.onrender.com/api/health`. The first call after sleep can take a minute.
2. Render → service → Logs. Lines are JSON; 500s carry a `requestId` that matches the `requestId` the user saw.
3. `"database":"unreachable"`: check Neon status and that the project is not suspended or over its quota. Neon → Monitoring.
4. A failed deploy: roll back (above).

The Uptime check workflow calls `/api/health` every 6 hours and emails the repository owner when it fails.

**A student reports harassment or their details posted without consent**

Admin page → Reported posts → Remove post. Removed notices and complaints can be restored from "Recently removed"; other posts are deleted. If one account keeps abusing, delete it in SQL (`DELETE FROM users WHERE id = '…'` removes everything it posted) and tell the other admin.

**A secret leaked** (database password, SMTP password, deploy hook)

1. Neon → Roles → `neondb_owner` → Reset password. Update `DATABASE_URL` on both Render services and `BACKUP_DATABASE_URL` on GitHub.
2. SMTP: revoke the app password and create a new one; update `SMTP_URL`.
3. Deploy hook: Render → Settings → regenerate; update the GitHub secret.
4. Sign everyone out if the session table could have been read: `UPDATE auth_sessions SET revoked_at = now() WHERE revoked_at IS NULL;`

**Someone lost admin access**: `UPDATE users SET role = 'admin' WHERE lower(email) = lower('…');` in the Neon SQL editor.

## Turning things on

- **Email verification**: set `SMTP_URL` and `MAIL_FROM` on the Render service. Gmail works with an app password: `smtps://you%40gmail.com:APP_PASSWORD@smtp.gmail.com:465`. From then on, unverified accounts can read but not post.
- **Fewer modules**: set `MODULES` to the ones you want, for example `notices,lost-found,lend-borrow,marketplace`.
- **Another university**: add its slug to `OPEN_UNIVERSITIES` and its email domain to `ALLOWED_EMAIL_DOMAINS`.
