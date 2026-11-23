# Launch checklist

Tick an item only when it is true in production, not when the code exists. Status as of 22 November 2026.

## Pilot go / no-go (target 4 January 2027)

### Security (all must be done)

- [x] Every `/api` route needs a session unless it is in `PUBLIC_ROUTES`; a test walks the router to prove it.
- [x] Writes take the user from the session; deletes are owner-or-admin; notices are admin-only.
- [x] The student directory is scoped to the university and hides phone and email unless the student opts in.
- [x] Passwords are bcrypt hashes; sessions are hashed, expire, and are revoked on sign-out and password change.
- [x] No seeded or documented demo accounts in production.
- [x] Rate limits, helmet, CORS allowlist, Origin check, body limit, schema validation on every write.
- [x] `.env` and the database file are no longer tracked. (Old commits still contain them; purging needs a coordinated rewrite with `unthinkingFool/CSB2.0`.)

### Operations

- [x] CI green on `main`: lint, types, build, audit, secret scan, API tests, browser test.
- [ ] CI deploys on its own: add `RENDER_DEPLOY_HOOK_URL` and `RENDER_STAGING_DEPLOY_HOOK_URL` as repository secrets.
- [x] A restore was tested once (Neon branch restore, see `docs/evidence/restore-log.md`).
- [ ] Nightly encrypted backups running: add `BACKUP_DATABASE_URL` and `BACKUP_PASSPHRASE`, run the workflow once, link the green run in the restore log.
- [x] Staging exists (`csb2-staging`, Neon branch `staging`).
- [ ] Staging holds no real student data (it started as a copy of production).
- [x] Runbook written (`docs/runbook.md`).

### Campus rules and privacy

- [x] Report button on every board and a moderation queue for admins.
- [x] Privacy notice at `/privacy`; consent at sign-up and for blood-donor listings.
- [x] Students can download their data and delete their account.
- [ ] Email verification switched on: set `SMTP_URL` and `MAIL_FROM` on Render, then sign up once to see the code arrive.
- [ ] A contact address on the privacy page (`VITE_PRIVACY_CONTACT`).
- [ ] Someone who knows Bangladesh's current data-protection rules has read the privacy notice. (Not legal advice; check it.)

### People

- [ ] Two administrators who will post notices and work the report queue, both with their own accounts.
- [ ] 30 to 50 invited students at BUET for the closed pilot.
- [ ] A weekly feedback form, and an hour a week to fix the top three issues.

## During the pilot (4 to 24 January 2027)

- [ ] Weekly: sign-ups, weekly active students, posts, reports, removals. Keep them in `docs/evidence/pilot.md`.
- [ ] Weekly: restore check is green in the Nightly backup workflow.
- [ ] No access or data incident; no severe bug open for more than 7 days.

## Pilot exit, then campus launch (early February 2027, not in exam weeks)

- [ ] At least half the invited students come back weekly.
- [ ] Admins still post and moderate without being asked.
- [ ] Someone other than the author tried to break it (OWASP ZAP baseline or a friend), and the findings are fixed. Record it in `docs/evidence/`.
- [x] Accessibility checked with axe on the main pages; findings fixed. (`tests/e2e/a11y.spec.ts` runs in CI on every push, both themes.)
- [ ] Decide which modules launch (`MODULES`); all ten are on today.
- [ ] Open sign-up to all of BUET.

## A second university

Only after 30 days of launch numbers you are happy with. Then add its slug to `OPEN_UNIVERSITIES` and its email domain to `ALLOWED_EMAIL_DOMAINS`.
