-- =============================================================================
-- CSB 2.0 database: PostgreSQL 14+ / PL/pgSQL
--
-- This file is the whole database: extensions, tables, migrations, triggers,
-- seed rows and every function the API calls. server.js holds no SQL besides
-- "SELECT fn(...)". It runs this file on every start, inside one transaction,
-- so every statement must be safe to re-run.
--
-- Layout
--   1. Extensions and helpers
--   2. Base tables (migration 1, CREATE TABLE IF NOT EXISTS)
--   3. Versioned migrations: DO blocks that run once each, recorded in
--      schema_migrations. To change a table that already exists, add a new
--      numbered block at the end of section 3; never edit an applied one.
--   4. Triggers and seed rows
--   5. Functions. Every API function is dropped and recreated on each start,
--      so argument lists and return types can change freely.
--
-- Access rules live in the functions, not the server: every function that
-- reads or writes campus data takes the signed-in user's id (from the
-- session, never the request body) and checks university scope, ownership
-- and role itself.
--
-- Errors meant for the client are raised with SQLSTATE 'CSnnn', where nnn is
-- the HTTP status the server answers with. The message is shown to the user.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- crypt()/gen_salt() passwords, digest() for session hashes

-- Drop every API function so section 5 can recreate them with any signature.
-- new_id() and touch_updated_at() stay: column defaults and triggers use them.
-- Functions that belong to extensions (pgcrypto) are left alone.
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname NOT IN ('new_id', 'touch_updated_at')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', f.sig);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION new_id() RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT 'id_' || replace(gen_random_uuid()::text, '-', '');
$$;

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Raise an error the server turns into an HTTP response.
CREATE OR REPLACE FUNCTION api_error(p_status int, p_message text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '%', p_message USING ERRCODE = 'CS' || p_status::text;
END;
$$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS universities (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  short_name  text,
  division    text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_name ON universities (lower(name));

CREATE TABLE IF NOT EXISTS users (
  id                 text PRIMARY KEY DEFAULT new_id(),
  name               text NOT NULL,
  email              text NOT NULL,
  password_hash      text NOT NULL,
  role               text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  phone              text,
  department         text,
  university_id      text REFERENCES universities (id),
  home_district      text,
  current_residence  text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_university ON users (university_id);

-- Board tables as first created (migration 1). Migration 2 below adds
-- university_id, soft-delete columns and the user_id foreign keys.

CREATE TABLE IF NOT EXISTS notices (
  id           text PRIMARY KEY DEFAULT new_id(),
  title        text NOT NULL,
  description  text NOT NULL,
  category     text NOT NULL,
  posted_by    text NOT NULL,
  user_id      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS complaints (
  id           text PRIMARY KEY DEFAULT new_id(),
  title        text NOT NULL,
  description  text NOT NULL,
  category     text NOT NULL,
  posted_by    text NOT NULL,
  user_id      text NOT NULL,
  status       text NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faculty_suggestions (
  id            text PRIMARY KEY DEFAULT new_id(),
  title         text NOT NULL,
  faculty_name  text NOT NULL,
  subject       text,
  rating        int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback      text NOT NULL,
  posted_by     text,
  user_id       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace (
  id           text PRIMARY KEY DEFAULT new_id(),
  title        text NOT NULL,
  description  text NOT NULL,
  price        numeric(12, 2) NOT NULL CHECK (price >= 0),
  category     text NOT NULL DEFAULT 'Other',
  is_sold      boolean NOT NULL DEFAULT false,
  seller       text NOT NULL,
  phone        text NOT NULL,
  user_id      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lending_items (
  id                text PRIMARY KEY DEFAULT new_id(),
  title             text NOT NULL CHECK (length(title) <= 100),
  description       text NOT NULL CHECK (length(description) <= 1200),
  category          text NOT NULL,
  item_condition    text NOT NULL,
  handoff_location  text NOT NULL CHECK (length(handoff_location) <= 120),
  status            text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed')),
  owner_id          text NOT NULL REFERENCES users (id),
  university_id     text REFERENCES universities (id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lending_items_university ON lending_items (university_id, status);

CREATE TABLE IF NOT EXISTS lending_requests (
  id            text PRIMARY KEY DEFAULT new_id(),
  item_id       text NOT NULL REFERENCES lending_items (id) ON DELETE CASCADE,
  requester_id  text NOT NULL REFERENCES users (id),
  message       text CHECK (length(message) <= 500),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'declined', 'returned')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- One open request per student per item.
CREATE UNIQUE INDEX IF NOT EXISTS idx_lending_active_request
  ON lending_requests (item_id, requester_id)
  WHERE status IN ('pending', 'approved');

CREATE TABLE IF NOT EXISTS lost_found (
  id              text PRIMARY KEY DEFAULT new_id(),
  title           text NOT NULL,
  description     text NOT NULL,
  item_type       text NOT NULL CHECK (item_type IN ('lost', 'found')),
  status          text NOT NULL DEFAULT 'lost',
  location        text NOT NULL,
  contact_number  text,
  posted_by       text,
  user_id         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bicycles (
  id              text PRIMARY KEY DEFAULT new_id(),
  brand           text NOT NULL,
  color           text NOT NULL,
  location        text NOT NULL,
  contact_number  text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'rented', 'maintenance')),
  rented_by       text,
  user_id         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blood_donation (
  id              text PRIMARY KEY DEFAULT new_id(),
  name            text NOT NULL,
  blood_type      text NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  contact_number  text NOT NULL,
  location        text NOT NULL,
  available_date  date NOT NULL,
  user_id         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS animal_welfare (
  id           text PRIMARY KEY DEFAULT new_id(),
  title        text NOT NULL,
  description  text NOT NULL,
  location     text NOT NULL,
  urgency      text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  posted_by    text,
  user_id      text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Migrations
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     int PRIMARY KEY,
  name        text NOT NULL,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO schema_migrations (version, name) VALUES (1, 'base tables') ON CONFLICT DO NOTHING;

-- 2: session-only writes, university scope, hashed revocable sessions.
DO $$
DECLARE
  t       text;
  v_admin text;
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 2) THEN
    RETURN;
  END IF;

  ALTER TABLE users ADD COLUMN IF NOT EXISTS show_contact boolean NOT NULL DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

  -- Sessions store only a SHA-256 of the token. Replacing the table signs
  -- everyone out once.
  DROP TABLE IF EXISTS auth_sessions;
  CREATE TABLE auth_sessions (
    token_hash  text PRIMARY KEY,
    user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    user_agent  text
  );
  CREATE INDEX idx_auth_sessions_user ON auth_sessions (user_id);

  -- Rows posted under a placeholder id have no owner: give them to the first
  -- admin, or drop them when there is no admin yet.
  SELECT id INTO v_admin FROM users WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  FOREACH t IN ARRAY ARRAY[
    'notices', 'complaints', 'faculty_suggestions', 'marketplace',
    'lost_found', 'bicycles', 'blood_donation', 'animal_welfare'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS university_id text REFERENCES universities (id)', t);
    IF v_admin IS NOT NULL THEN
      EXECUTE format('UPDATE %I SET user_id = $1 WHERE user_id NOT IN (SELECT id FROM users)', t) USING v_admin;
    ELSE
      EXECUTE format('DELETE FROM %I WHERE user_id NOT IN (SELECT id FROM users)', t);
    END IF;
    EXECUTE format(
      'UPDATE %I x SET university_id = u.university_id FROM users u
        WHERE u.id = x.user_id AND x.university_id IS NULL', t);
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE',
      t, t || '_user_id_fkey');
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (university_id, created_at DESC)',
      'idx_' || t || '_university_created', t);
  END LOOP;

  -- Notices and complaints are soft-deleted so a mistake can be undone.
  ALTER TABLE notices
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN deleted_by text REFERENCES users (id) ON DELETE SET NULL;
  ALTER TABLE complaints
    ADD COLUMN deleted_at timestamptz,
    ADD COLUMN deleted_by text REFERENCES users (id) ON DELETE SET NULL;

  -- Deleting an account removes its lending listings and requests too.
  ALTER TABLE lending_items DROP CONSTRAINT IF EXISTS lending_items_owner_id_fkey;
  ALTER TABLE lending_items ADD CONSTRAINT lending_items_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE;
  ALTER TABLE lending_requests DROP CONSTRAINT IF EXISTS lending_requests_requester_id_fkey;
  ALTER TABLE lending_requests ADD CONSTRAINT lending_requests_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE;

  INSERT INTO schema_migrations (version, name)
  VALUES (2, 'session-only writes, university scope, hashed sessions');
END;
$$;

-- 3: email verification codes, reports and moderation, privacy consent.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 3) THEN
    RETURN;
  END IF;

  -- When the student accepted the privacy notice at sign-up.
  ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;

  -- One live code per user; only its hash is stored.
  CREATE TABLE email_verifications (
    user_id     text PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    code_hash   text NOT NULL,
    expires_at  timestamptz NOT NULL,
    attempts    int NOT NULL DEFAULT 0,
    sent_at     timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE reports (
    id           text PRIMARY KEY DEFAULT new_id(),
    board        text NOT NULL,
    row_id       text NOT NULL,
    reporter_id  text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    university_id text REFERENCES universities (id),
    reason       text NOT NULL CHECK (reason IN ('spam', 'harassment', 'personal_info', 'false', 'inappropriate', 'other')),
    details      text CHECK (length(details) <= 500),
    status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'removed')),
    resolved_by  text REFERENCES users (id) ON DELETE SET NULL,
    resolved_at  timestamptz,
    created_at   timestamptz NOT NULL DEFAULT now()
  );
  -- A student can report a post once.
  CREATE UNIQUE INDEX idx_reports_once ON reports (board, row_id, reporter_id);
  CREATE INDEX idx_reports_open ON reports (university_id, status, created_at DESC);

  INSERT INTO schema_migrations (version, name)
  VALUES (3, 'email verification, reports, privacy consent');
END;
$$;

-- 4: moderation tools. Posts hide themselves after three reports, admins can
-- suspend an account, and every moderation step is written to a log.
DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM schema_migrations WHERE version = 4) THEN
    RETURN;
  END IF;

  FOREACH t IN ARRAY ARRAY['notices', 'complaints', 'faculty_suggestions', 'marketplace',
                           'lost_found', 'bicycles', 'blood_donation', 'animal_welfare'] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS hidden_at timestamptz', t);
  END LOOP;

  ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_reason text CHECK (length(suspended_reason) <= 300);

  CREATE TABLE moderation_log (
    id             text PRIMARY KEY DEFAULT new_id(),
    university_id  text REFERENCES universities (id),
    actor_id       text REFERENCES users (id) ON DELETE SET NULL,   -- NULL: done automatically
    action         text NOT NULL CHECK (action IN ('auto_hide', 'remove', 'dismiss', 'restore',
                                                    'delete_post', 'suspend', 'unsuspend')),
    board          text,
    row_id         text,
    target_user_id text REFERENCES users (id) ON DELETE SET NULL,
    detail         text CHECK (length(detail) <= 300),
    created_at     timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX idx_moderation_log ON moderation_log (university_id, created_at DESC);

  INSERT INTO schema_migrations (version, name)
  VALUES (4, 'auto-hide, suspensions, moderation log');
END;
$$;

-- Keep updated_at current on every UPDATE.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'notices', 'complaints', 'faculty_suggestions', 'marketplace',
    'lending_items', 'lending_requests', 'lost_found', 'bicycles',
    'blood_donation', 'animal_welfare'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I
         FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t);
  END LOOP;
END;
$$;

-- -----------------------------------------------------------------------------
-- Seed: university catalog. id = slug = short name in lowercase.
-- Registration is limited to the slugs in OPEN_UNIVERSITIES (default "buet").
-- No user accounts are seeded. Promote the first admin by hand:
--   UPDATE users SET role = 'admin' WHERE lower(email) = lower('<their email>');
-- -----------------------------------------------------------------------------

INSERT INTO universities (id, name, slug, short_name, division) VALUES
  ('buet', 'Bangladesh University of Engineering and Technology', 'buet', 'BUET', 'Dhaka'),
  ('ruet', 'Rajshahi University of Engineering and Technology',   'ruet', 'RUET', 'Rajshahi'),
  ('du',   'University of Dhaka',                                  'du',   'DU',   'Dhaka'),
  ('ru',   'University of Rajshahi',                               'ru',   'RU',   'Rajshahi'),
  ('cu',   'University of Chittagong',                             'cu',   'CU',   'Chattogram'),
  ('ju',   'Jahangirnagar University',                             'ju',   'JU',   'Dhaka'),
  ('ku',   'Khulna University',                                    'ku',   'KU',   'Khulna'),
  ('sust', 'Shahjalal University of Science and Technology',       'sust', 'SUST', 'Sylhet'),
  ('cuet', 'Chittagong University of Engineering and Technology',  'cuet', 'CUET', 'Chattogram'),
  ('kuet', 'Khulna University of Engineering and Technology',      'kuet', 'KUET', 'Khulna'),
  ('duet', 'Dhaka University of Engineering and Technology',       'duet', 'DUET', 'Dhaka'),
  ('bau',  'Bangladesh Agricultural University',                   'bau',  'BAU',  'Mymensingh')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. Functions
-- =============================================================================

-- ---- Helpers ----------------------------------------------------------------

-- The signed-in user, or a 401. p_user_id always comes from the session.
CREATE OR REPLACE FUNCTION actor(p_user_id text) RETURNS users
LANGUAGE plpgsql STABLE AS $$
DECLARE u users;
BEGIN
  IF p_user_id IS NULL THEN
    PERFORM api_error(401, 'Sign in required');
  END IF;
  SELECT * INTO u FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    PERFORM api_error(401, 'Sign in required');
  END IF;
  IF u.suspended_at IS NOT NULL THEN
    PERFORM api_error(403, 'This account is suspended. Contact your university administrator.');
  END IF;
  RETURN u;
END;
$$;

CREATE OR REPLACE FUNCTION require_admin(p_user_id text) RETURNS users
LANGUAGE plpgsql STABLE AS $$
DECLARE u users := actor(p_user_id);
BEGIN
  IF u.role <> 'admin' THEN
    PERFORM api_error(403, 'Only an administrator can do that');
  END IF;
  RETURN u;
END;
$$;

-- Page size: 50 by default, never more than 100.
CREATE OR REPLACE FUNCTION page_size(p_limit int) RETURNS int
LANGUAGE sql IMMUTABLE AS $$
  SELECT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
$$;

CREATE OR REPLACE FUNCTION token_hash(p_token text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT encode(digest(p_token, 'sha256'), 'hex');
$$;

-- =============================================================================
-- Accounts and sessions
-- =============================================================================

-- The user object every auth endpoint returns. Never includes the password.
CREATE OR REPLACE FUNCTION user_json(p_user_id text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'id',                 u.id,
    'name',               u.name,
    'email',              u.email,
    'role',               u.role,
    'phone',              u.phone,
    'department',         u.department,
    'universityId',       u.university_id,
    'universityName',     un.name,
    'homeDistrict',       u.home_district,
    'currentResidence',   u.current_residence,
    'showContact',        u.show_contact,
    'emailVerified',      u.email_verified_at IS NOT NULL,
    'mustChangePassword', u.must_change_password,
    'privacyAccepted',    u.privacy_accepted_at IS NOT NULL
  )
  FROM users u
  LEFT JOIN universities un ON un.id = u.university_id
  WHERE u.id = p_user_id;
$$;

-- Returns the raw token once; only its hash is stored.
CREATE OR REPLACE FUNCTION create_session(p_user_id text, p_user_agent text, p_days int DEFAULT 7) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE v_token text := encode(gen_random_bytes(32), 'hex');
BEGIN
  DELETE FROM auth_sessions WHERE expires_at <= now() - interval '30 days';
  INSERT INTO auth_sessions (token_hash, user_id, expires_at, user_agent)
  VALUES (token_hash(v_token), p_user_id, now() + make_interval(days => p_days), left(p_user_agent, 300));
  RETURN v_token;
END;
$$;

-- The session's user for a token (id, name, role, university), or NULL when
-- the token is unknown, expired or revoked.
CREATE OR REPLACE FUNCTION session_user_info(p_token text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('id', u.id, 'name', u.name, 'role', u.role, 'universityId', u.university_id,
                            'emailVerified', u.email_verified_at IS NOT NULL,
                            'mustChangePassword', u.must_change_password)
  FROM auth_sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = token_hash(p_token)
    AND s.revoked_at IS NULL
    AND s.expires_at > now();
$$;

CREATE OR REPLACE FUNCTION end_session(p_token text) RETURNS jsonb
LANGUAGE sql AS $$
  UPDATE auth_sessions SET revoked_at = now()
  WHERE token_hash = token_hash(p_token) AND revoked_at IS NULL;
  SELECT jsonb_build_object('success', true);
$$;

CREATE OR REPLACE FUNCTION login_user(p_email text, p_password text, p_user_agent text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_id text;
BEGIN
  SELECT id INTO v_id FROM users
  WHERE lower(email) = lower(trim(p_email))
    AND password_hash = crypt(p_password, password_hash);
  IF v_id IS NULL THEN
    PERFORM api_error(401, 'Invalid email or password');
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = v_id AND suspended_at IS NOT NULL) THEN
    PERFORM api_error(403, 'This account is suspended. Contact your university administrator.');
  END IF;
  RETURN jsonb_build_object(
    'success', true,
    'token',   create_session(v_id, p_user_agent),
    'user',    user_json(v_id)
  );
END;
$$;

-- Format checks (email shape, password strength, email domain) happen in the
-- server before this is called; this enforces the rules that need the data.
CREATE OR REPLACE FUNCTION register_user(
  p_name               text,
  p_email              text,
  p_password           text,
  p_phone              text,
  p_department         text,
  p_university_name    text,
  p_home_district      text,
  p_current_residence  text,
  p_open_slugs         text[],
  p_user_agent         text,
  p_privacy_accepted   boolean
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_university_id text;
  v_id            text;
  v_uni_name      text := regexp_replace(trim(p_university_name), '\s+', ' ', 'g');
BEGIN
  SELECT id INTO v_university_id FROM universities
  WHERE is_active
    AND (lower(name) = lower(v_uni_name) OR lower(short_name) = lower(v_uni_name))
    AND slug = ANY (p_open_slugs);
  IF v_university_id IS NULL THEN
    PERFORM api_error(403, 'CSB 2.0 is open to BUET students only for now. More universities are coming later.');
  END IF;

  IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(trim(p_email))) THEN
    PERFORM api_error(409, 'Email already registered');
  END IF;

  INSERT INTO users (
    name, email, password_hash, role, phone, department,
    university_id, home_district, current_residence, privacy_accepted_at
  ) VALUES (
    trim(p_name), lower(trim(p_email)), crypt(p_password, gen_salt('bf', 12)), 'student',
    trim(p_phone), trim(p_department),
    v_university_id, trim(p_home_district), trim(p_current_residence),
    CASE WHEN p_privacy_accepted THEN now() END
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'token',   create_session(v_id, p_user_agent),
    'user',    user_json(v_id),
    'message', 'Account created successfully'
  );
EXCEPTION
  WHEN unique_violation THEN
    PERFORM api_error(409, 'Email already registered');
END;
$$;

CREATE OR REPLACE FUNCTION verify_session(p_user_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
BEGIN
  PERFORM actor(p_user_id);
  RETURN jsonb_build_object('success', true, 'user', user_json(p_user_id));
END;
$$;

-- NULL arguments leave a field unchanged. Students edit themselves; admins
-- may edit anyone.
CREATE OR REPLACE FUNCTION update_profile(
  p_actor_id     text,
  p_user_id      text,
  p_name         text,
  p_phone        text,
  p_department   text,
  p_show_contact boolean
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id);
BEGIN
  IF a.id <> p_user_id AND a.role <> 'admin' THEN
    PERFORM api_error(403, 'You can only update your own profile');
  END IF;
  UPDATE users SET
    name         = COALESCE(NULLIF(trim(p_name), ''), name),
    phone        = COALESCE(p_phone, phone),
    department   = COALESCE(p_department, department),
    show_contact = COALESCE(p_show_contact, show_contact)
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'User not found');
  END IF;
  RETURN jsonb_build_object('success', true, 'user', user_json(p_user_id));
END;
$$;

-- Changing the password ends every other session of the account.
CREATE OR REPLACE FUNCTION change_password(p_actor_id text, p_old text, p_new text, p_current_token text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id);
BEGIN
  IF a.password_hash <> crypt(p_old, a.password_hash) THEN
    PERFORM api_error(401, 'Current password is incorrect');
  END IF;
  UPDATE users SET password_hash = crypt(p_new, gen_salt('bf', 12)), must_change_password = false
  WHERE id = a.id;
  UPDATE auth_sessions SET revoked_at = now()
  WHERE user_id = a.id AND revoked_at IS NULL AND token_hash <> token_hash(COALESCE(p_current_token, ''));
  RETURN jsonb_build_object('success', true, 'message', 'Password changed. Other devices were signed out.');
END;
$$;

-- Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD when the
-- database has none. The account must change its password at first sign-in.
CREATE OR REPLACE FUNCTION ensure_admin(p_email text, p_password text) RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    RETURN 'admin exists';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(trim(p_email))) THEN
    UPDATE users SET role = 'admin' WHERE lower(email) = lower(trim(p_email));
    RETURN 'promoted existing account';
  END IF;
  INSERT INTO users (name, email, password_hash, role, university_id, must_change_password, email_verified_at)
  VALUES ('Administrator', lower(trim(p_email)), crypt(p_password, gen_salt('bf', 12)), 'admin',
          (SELECT id FROM universities WHERE slug = 'buet'), true, now());
  RETURN 'created';
END;
$$;

-- Students at the viewer's university. Phone and email appear only for
-- students who opted in, for the viewer themself, and for admins.
CREATE OR REPLACE FUNCTION list_directory(p_actor_id text, p_search text, p_limit int, p_offset int) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := actor(p_actor_id);
BEGIN
  RETURN jsonb_build_object('success', true, 'users', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object('id', u.id, 'name', u.name, 'role', u.role, 'department', u.department)
      || CASE WHEN u.show_contact OR u.id = a.id OR a.role = 'admin'
              THEN jsonb_build_object('email', u.email, 'phone', u.phone)
              ELSE '{}'::jsonb END
      ORDER BY lower(u.name))
    FROM (
      SELECT * FROM users u
      WHERE u.university_id IS NOT DISTINCT FROM a.university_id
        AND (COALESCE(p_search, '') = ''
             OR u.name ILIKE '%' || p_search || '%'
             OR u.department ILIKE '%' || p_search || '%')
      ORDER BY lower(u.name)
      LIMIT page_size(p_limit) OFFSET GREATEST(COALESCE(p_offset, 0), 0)
    ) u
  ), '[]'::jsonb));
END;
$$;

-- =============================================================================
-- Universities and stats
-- =============================================================================

CREATE OR REPLACE FUNCTION list_open_universities(p_open_slugs text[]) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('success', true, 'universities', COALESCE(jsonb_agg(
    jsonb_build_object('id', id, 'name', name, 'shortName', short_name, 'division', division)
    ORDER BY lower(name)), '[]'::jsonb))
  FROM universities
  WHERE is_active AND slug = ANY (p_open_slugs);
$$;

-- Public, aggregate-only counts for the landing page.
CREATE OR REPLACE FUNCTION campus_stats(p_slug text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE v_campus universities;
BEGIN
  SELECT * INTO v_campus FROM universities WHERE slug = p_slug;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Campus not found');
  END IF;
  RETURN jsonb_build_object(
    'success', true,
    'campus', jsonb_build_object('id', v_campus.id, 'name', v_campus.name, 'shortName', v_campus.short_name),
    'stats', jsonb_build_object(
      'members',       (SELECT count(*)::int FROM users WHERE university_id = v_campus.id),
      'notices',       (SELECT count(*)::int FROM notices WHERE university_id = v_campus.id AND deleted_at IS NULL),
      'openLostItems', (SELECT count(*)::int FROM lost_found WHERE university_id = v_campus.id AND status = 'lost'),
      'itemsToBorrow', (SELECT count(*)::int FROM lending_items
                        WHERE university_id = v_campus.id AND status = 'available')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_metrics(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE v_rows jsonb;
BEGIN
  PERFORM require_admin(p_actor_id);
  WITH per_university AS (
    SELECT un.id, un.name, un.short_name, un.division,
           count(u.id) FILTER (WHERE u.role = 'student')::int AS student_count,
           count(u.id) FILTER (WHERE u.role = 'student'
             AND date_trunc('month', u.created_at) = date_trunc('month', now()))::int AS this_month
    FROM universities un
    LEFT JOIN users u ON u.university_id = un.id
    WHERE un.is_active
    GROUP BY un.id
  )
  SELECT jsonb_build_object(
    'success',           true,
    'universityCount',   count(*)::int,
    'studentCount',      COALESCE(sum(student_count), 0)::int,
    'studentsThisMonth', COALESCE(sum(this_month), 0)::int,
    'universities',      COALESCE(jsonb_agg(jsonb_build_object(
                           'id', id, 'name', name, 'shortName', short_name, 'division', division,
                           'studentCount', student_count, 'studentsThisMonth', this_month)
                           ORDER BY student_count DESC, lower(name)), '[]'::jsonb)
  ) INTO v_rows
  FROM per_university;
  RETURN v_rows;
END;
$$;

-- Admin overview: the charts on /admin. Everything is scoped to the admin's
-- university and bucketed in Bangladesh time. p_months is 3, 6 or 12; each
-- figure comes with the same figure for the period just before it.
CREATE OR REPLACE FUNCTION admin_overview(p_actor_id text, p_months int) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  a        users := require_admin(p_actor_id);
  v_months int := CASE WHEN p_months IN (3, 6, 12) THEN p_months ELSE 12 END;
  v_shift  interval;
  v_now    timestamp := now() AT TIME ZONE 'Asia/Dhaka';
  v_start  timestamp;
  v_prev   timestamp;
  v_out    jsonb;
BEGIN
  v_shift := make_interval(months => v_months);
  v_start := date_trunc('month', v_now) - make_interval(months => v_months - 1);
  v_prev  := v_start - v_shift;

  WITH posts AS (
    SELECT 'notices'::text AS board, created_at AT TIME ZONE 'Asia/Dhaka' AS at, user_id
      FROM notices WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'complaints', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM complaints WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'faculty_suggestions', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM faculty_suggestions WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'marketplace', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM marketplace WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'lost_found', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM lost_found WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'bicycles', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM bicycles WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'blood_donation', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM blood_donation WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'animal_welfare', created_at AT TIME ZONE 'Asia/Dhaka', user_id
      FROM animal_welfare WHERE university_id IS NOT DISTINCT FROM a.university_id
    UNION ALL SELECT 'lending_items', created_at AT TIME ZONE 'Asia/Dhaka', owner_id
      FROM lending_items WHERE university_id IS NOT DISTINCT FROM a.university_id
  ),
  students AS (
    SELECT created_at AT TIME ZONE 'Asia/Dhaka' AS at FROM users
     WHERE role = 'student' AND university_id IS NOT DISTINCT FROM a.university_id
  ),
  reps AS (
    SELECT board, status, created_at AT TIME ZONE 'Asia/Dhaka' AS at FROM reports
     WHERE university_id IS NOT DISTINCT FROM a.university_id
  ),
  months AS (
    SELECT generate_series(v_start, date_trunc('month', v_now), interval '1 month') AS m
  ),
  series AS (
    SELECT m,
      (SELECT count(*) FROM students s WHERE date_trunc('month', s.at) = m)::int            AS signups,
      (SELECT count(*) FROM students s WHERE date_trunc('month', s.at) = m - v_shift)::int  AS signups_prev,
      (SELECT count(*) FROM posts p WHERE date_trunc('month', p.at) = m)::int               AS posts,
      (SELECT count(*) FROM posts p WHERE date_trunc('month', p.at) = m - v_shift)::int     AS posts_prev,
      (SELECT count(*) FROM reps r WHERE date_trunc('month', r.at) = m)::int                AS reports,
      (SELECT count(*) FROM reps r WHERE date_trunc('month', r.at) = m - v_shift)::int      AS reports_prev
    FROM months
  ),
  boards AS (
    SELECT b.board,
      (SELECT count(*) FROM posts p WHERE p.board = b.board AND p.at >= v_start)::int AS posts,
      (SELECT count(*) FROM posts p WHERE p.board = b.board AND p.at >= v_prev AND p.at < v_start)::int AS previous,
      (SELECT count(*) FROM posts p WHERE p.board = b.board)::int AS all_time,
      (SELECT max(p.at) FROM posts p WHERE p.board = b.board) AS last_post,
      (SELECT count(*) FROM reps r WHERE r.board = b.board AND r.status = 'open')::int AS open_reports,
      (SELECT jsonb_agg((SELECT count(*) FROM posts p WHERE p.board = b.board AND date_trunc('month', p.at) = mm.m) ORDER BY mm.m)
         FROM months mm) AS spark
    FROM unnest(board_tables() || ARRAY['lending_items']) AS b(board)
  ),
  weekdays AS (
    SELECT d.dow, (SELECT count(*) FROM posts p WHERE p.at >= v_start AND extract(dow FROM p.at) = d.dow)::int AS posts
    FROM generate_series(0, 6) AS d(dow)
  )
  SELECT jsonb_build_object(
    'success', true,
    'months', v_months,
    'from', v_start::date,
    'kpis', jsonb_build_object(
      'students', jsonb_build_object(
        'total',    (SELECT count(*) FROM students)::int,
        'value',    (SELECT count(*) FROM students WHERE at >= v_start)::int,
        'previous', (SELECT count(*) FROM students WHERE at >= v_prev AND at < v_start)::int),
      'posts', jsonb_build_object(
        'value',    (SELECT count(*) FROM posts WHERE at >= v_start)::int,
        'previous', (SELECT count(*) FROM posts WHERE at >= v_prev AND at < v_start)::int),
      'activePosters', jsonb_build_object(
        'value',    (SELECT count(DISTINCT user_id) FROM posts WHERE at >= v_start)::int,
        'previous', (SELECT count(DISTINCT user_id) FROM posts WHERE at >= v_prev AND at < v_start)::int),
      'reports', jsonb_build_object(
        'value',    (SELECT count(*) FROM reps WHERE at >= v_start)::int,
        'handled',  (SELECT count(*) FROM reps WHERE at >= v_start AND status <> 'open')::int,
        'open',     (SELECT count(*) FROM reps WHERE status = 'open')::int)),
    'series', (SELECT jsonb_agg(jsonb_build_object(
        'month', to_char(m, 'YYYY-MM'),
        'signups', signups, 'signupsPrev', signups_prev,
        'posts', posts, 'postsPrev', posts_prev,
        'reports', reports, 'reportsPrev', reports_prev) ORDER BY m) FROM series),
    'boards', (SELECT jsonb_agg(jsonb_build_object(
        'board', board, 'posts', posts, 'previous', previous, 'allTime', all_time,
        'lastPostAt', last_post, 'openReports', open_reports, 'spark', spark)
        ORDER BY posts DESC, all_time DESC, board) FROM boards),
    'weekdays', (SELECT jsonb_agg(jsonb_build_object('dow', dow, 'posts', posts) ORDER BY dow) FROM weekdays)
  ) INTO v_out;
  RETURN v_out;
END;
$$;

-- =============================================================================
-- Campus boards
--
-- Every board is scoped to the signed-in user's university. Rows go out
-- without user_id, deleted_at or deleted_by; instead each row says whether
-- the viewer posted it (is_mine) and may delete it (can_delete).
-- =============================================================================

-- One line in the moderation log. p_actor NULL means it happened automatically.
CREATE OR REPLACE FUNCTION log_moderation(
  p_university text, p_actor text, p_action text, p_board text, p_row_id text, p_target text, p_detail text
) RETURNS void
LANGUAGE sql AS $$
  INSERT INTO moderation_log (university_id, actor_id, action, board, row_id, target_user_id, detail)
  VALUES (p_university, p_actor, p_action, p_board, p_row_id, p_target, left(p_detail, 300));
$$;

CREATE OR REPLACE FUNCTION board_tables() RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY['notices', 'complaints', 'faculty_suggestions', 'marketplace',
               'lost_found', 'bicycles', 'blood_donation', 'animal_welfare'];
$$;

CREATE OR REPLACE FUNCTION board_row(p_row jsonb, p_actor users) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT (p_row - 'user_id' - 'deleted_at' - 'deleted_by' - 'hidden_at')
    || jsonb_build_object(
         'hidden',     p_row->>'hidden_at' IS NOT NULL,
         'is_mine',    p_row->>'user_id' = p_actor.id,
         'can_delete', p_row->>'user_id' = p_actor.id OR p_actor.role = 'admin');
$$;

-- Newest first, p_limit rows (max 100) created before p_before.
CREATE OR REPLACE FUNCTION list_board(p_table text, p_actor_id text, p_limit int, p_before timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  a      users := actor(p_actor_id);
  v_soft boolean := p_table IN ('notices', 'complaints');
  v_out  jsonb;
BEGIN
  IF NOT p_table = ANY (board_tables()) THEN
    PERFORM api_error(404, 'Unknown board');
  END IF;
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(board_row(to_jsonb(r), $1) ORDER BY r.created_at DESC), ''[]''::jsonb)
       FROM (SELECT * FROM %I
              WHERE university_id IS NOT DISTINCT FROM $1.university_id
                AND ($2::timestamptz IS NULL OR created_at < $2)
                AND (hidden_at IS NULL OR user_id = $1.id OR $1.role = ''admin'')
                %s
              ORDER BY created_at DESC
              LIMIT $3) r',
    p_table, CASE WHEN v_soft THEN 'AND deleted_at IS NULL' ELSE '' END)
  INTO v_out USING a, p_before, page_size(p_limit);
  RETURN v_out;
END;
$$;

-- Owner or admin. Notices: admin only. Notices and complaints are soft-deleted.
CREATE OR REPLACE FUNCTION delete_board_row(p_table text, p_actor_id text, p_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a       users := actor(p_actor_id);
  v_owner text;
  v_uni   text;
BEGIN
  IF NOT p_table = ANY (board_tables()) THEN
    PERFORM api_error(404, 'Unknown board');
  END IF;
  EXECUTE format('SELECT user_id, university_id FROM %I WHERE id = $1 %s', p_table,
                 CASE WHEN p_table IN ('notices', 'complaints') THEN 'AND deleted_at IS NULL' ELSE '' END)
    INTO v_owner, v_uni USING p_id;
  IF v_owner IS NULL OR (a.role <> 'admin' AND v_uni IS DISTINCT FROM a.university_id) THEN
    PERFORM api_error(404, 'Not found');
  END IF;
  IF p_table = 'notices' AND a.role <> 'admin' THEN
    PERFORM api_error(403, 'Only an administrator can remove notices');
  END IF;
  IF a.role <> 'admin' AND v_owner <> a.id THEN
    PERFORM api_error(403, 'You can only delete your own posts');
  END IF;

  IF p_table IN ('notices', 'complaints') THEN
    EXECUTE format('UPDATE %I SET deleted_at = now(), deleted_by = $2 WHERE id = $1', p_table) USING p_id, a.id;
  ELSE
    EXECUTE format('DELETE FROM %I WHERE id = $1', p_table) USING p_id;
  END IF;
  IF v_owner <> a.id THEN
    PERFORM log_moderation(v_uni, a.id, 'delete_post', p_table, p_id, v_owner, NULL);
  END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Deleted');
END;
$$;

-- Admins can bring back a soft-deleted notice or complaint.
CREATE OR REPLACE FUNCTION restore_board_row(p_table text, p_actor_id text, p_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a      users := require_admin(p_actor_id);
  v_rows int;
BEGIN
  IF p_table NOT IN ('notices', 'complaints') THEN
    PERFORM api_error(404, 'Unknown board');
  END IF;
  EXECUTE format('UPDATE %I SET deleted_at = NULL, deleted_by = NULL WHERE id = $1 AND deleted_at IS NOT NULL', p_table)
    USING p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;   -- EXECUTE does not set FOUND
  IF v_rows = 0 THEN
    PERFORM api_error(404, 'Not found');
  END IF;
  PERFORM log_moderation(a.university_id, a.id, 'restore', p_table, p_id, NULL, NULL);
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Recently removed notices and complaints, for the admin.
CREATE OR REPLACE FUNCTION list_removed(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := require_admin(p_actor_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'deleted_at' DESC) FROM (
      SELECT jsonb_build_object('board', 'notices', 'id', n.id, 'title', n.title,
                                'deleted_at', n.deleted_at, 'deleted_by', d.name) AS x
      FROM notices n LEFT JOIN users d ON d.id = n.deleted_by
      WHERE n.deleted_at IS NOT NULL AND n.university_id IS NOT DISTINCT FROM a.university_id
      UNION ALL
      SELECT jsonb_build_object('board', 'complaints', 'id', c.id, 'title', c.title,
                                'deleted_at', c.deleted_at, 'deleted_by', d.name)
      FROM complaints c LEFT JOIN users d ON d.id = c.deleted_by
      WHERE c.deleted_at IS NOT NULL AND c.university_id IS NOT DISTINCT FROM a.university_id
      LIMIT 100
    ) s
  ), '[]'::jsonb);
END;
$$;

-- ---- Create functions: owner, poster name and university come from the user --

CREATE OR REPLACE FUNCTION create_notice(p_actor_id text, p_title text, p_description text, p_category text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := require_admin(p_actor_id); r notices;
BEGIN
  INSERT INTO notices (title, description, category, posted_by, user_id, university_id)
  VALUES (p_title, p_description, p_category, a.name, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_complaint(
  p_actor_id text, p_title text, p_description text, p_category text, p_anonymous boolean
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r complaints;
BEGIN
  INSERT INTO complaints (title, description, category, posted_by, user_id, university_id)
  VALUES (p_title, p_description, p_category,
          CASE WHEN p_anonymous THEN 'Anonymous' ELSE a.name END, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_faculty_suggestion(
  p_actor_id text, p_title text, p_faculty_name text, p_subject text, p_rating int,
  p_feedback text, p_anonymous boolean
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r faculty_suggestions;
BEGIN
  INSERT INTO faculty_suggestions (title, faculty_name, subject, rating, feedback, posted_by, user_id, university_id)
  VALUES (p_title, p_faculty_name, NULLIF(trim(p_subject), ''), p_rating, p_feedback,
          CASE WHEN p_anonymous THEN 'Anonymous' ELSE a.name END, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_marketplace_item(
  p_actor_id text, p_title text, p_description text, p_price numeric, p_category text, p_phone text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r marketplace;
BEGIN
  INSERT INTO marketplace (title, description, price, category, seller, phone, user_id, university_id)
  VALUES (p_title, p_description, p_price, COALESCE(NULLIF(trim(p_category), ''), 'Other'),
          a.name, COALESCE(NULLIF(trim(p_phone), ''), a.phone, ''), a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_lost_found_item(
  p_actor_id text, p_title text, p_description text, p_item_type text,
  p_location text, p_contact_number text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r lost_found;
BEGIN
  INSERT INTO lost_found (title, description, item_type, status, location, contact_number, posted_by, user_id, university_id)
  VALUES (p_title, p_description, p_item_type, p_item_type, p_location,
          NULLIF(trim(p_contact_number), ''), a.name, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_bicycle(
  p_actor_id text, p_brand text, p_color text, p_location text, p_contact_number text, p_description text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r bicycles;
BEGIN
  INSERT INTO bicycles (brand, color, location, contact_number, description, user_id, university_id)
  VALUES (p_brand, COALESCE(NULLIF(trim(p_color), ''), 'Unknown'), COALESCE(NULLIF(trim(p_location), ''), 'Campus'),
          COALESCE(NULLIF(trim(p_contact_number), ''), a.phone, 'N/A'), p_description, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_blood_donor(
  p_actor_id text, p_blood_type text, p_contact_number text, p_location text, p_available_date date
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r blood_donation;
BEGIN
  INSERT INTO blood_donation (name, blood_type, contact_number, location, available_date, user_id, university_id)
  VALUES (a.name, p_blood_type, p_contact_number, p_location,
          COALESCE(p_available_date, current_date), a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

CREATE OR REPLACE FUNCTION create_animal_report(
  p_actor_id text, p_title text, p_description text, p_location text, p_urgency text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id); r animal_welfare;
BEGIN
  INSERT INTO animal_welfare (title, description, location, urgency, posted_by, user_id, university_id)
  VALUES (p_title, p_description, p_location, COALESCE(p_urgency, 'medium'), a.name, a.id, a.university_id)
  RETURNING * INTO r;
  RETURN board_row(to_jsonb(r), a);
END;
$$;

-- =============================================================================
-- Lend & borrow (scoped to the signed-in student's university)
-- =============================================================================

CREATE OR REPLACE FUNCTION lending_item_json(p_item_id text, p_viewer_id text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT to_jsonb(i) || jsonb_build_object(
    'owner_name', o.name,
    'has_active_request', EXISTS (
      SELECT 1 FROM lending_requests r
      WHERE r.item_id = i.id AND r.requester_id = p_viewer_id
        AND r.status IN ('pending', 'approved'))
  )
  FROM lending_items i
  JOIN users o ON o.id = i.owner_id
  WHERE i.id = p_item_id;
$$;

CREATE OR REPLACE FUNCTION list_lending_items(p_user_id text, p_limit int, p_before timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := actor(p_user_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(lending_item_json(i.id, a.id) ORDER BY i.created_at DESC)
    FROM (
      SELECT * FROM lending_items i
      WHERE i.university_id IS NOT DISTINCT FROM a.university_id
        AND (i.status = 'available' OR i.owner_id = a.id)
        AND (p_before IS NULL OR i.created_at < p_before)
      ORDER BY i.created_at DESC
      LIMIT page_size(p_limit)
    ) i
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION create_lending_item(
  p_user_id text, p_title text, p_description text, p_category text,
  p_item_condition text, p_handoff_location text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_user_id); v_id text;
BEGIN
  INSERT INTO lending_items (title, description, category, item_condition, handoff_location, owner_id, university_id)
  VALUES (trim(p_title), trim(p_description), trim(p_category), trim(p_item_condition),
          trim(p_handoff_location), a.id, a.university_id)
  RETURNING id INTO v_id;
  RETURN lending_item_json(v_id, a.id);
END;
$$;

CREATE OR REPLACE FUNCTION list_lending_requests(p_user_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := actor(p_user_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(to_jsonb(r) || jsonb_build_object(
             'item_title',     i.title,
             'owner_id',       i.owner_id,
             'item_status',    i.status,
             'owner_name',     o.name,
             'requester_name', q.name)
           ORDER BY r.created_at DESC)
    FROM lending_requests r
    JOIN lending_items i ON i.id = r.item_id
    JOIN users o ON o.id = i.owner_id
    JOIN users q ON q.id = r.requester_id
    WHERE i.university_id IS NOT DISTINCT FROM a.university_id
      AND (r.requester_id = a.id OR i.owner_id = a.id)
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION request_to_borrow(p_user_id text, p_item_id text, p_message text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a         users := actor(p_user_id);
  v_owner   text;
  v_id      text;
  v_message text := NULLIF(trim(COALESCE(p_message, '')), '');
BEGIN
  SELECT owner_id INTO v_owner FROM lending_items
  WHERE id = p_item_id
    AND university_id IS NOT DISTINCT FROM a.university_id
    AND status = 'available';
  IF NOT FOUND THEN
    PERFORM api_error(404, 'This item is no longer available');
  END IF;
  IF v_owner = a.id THEN
    PERFORM api_error(400, 'You cannot request to borrow your own item');
  END IF;
  INSERT INTO lending_requests (item_id, requester_id, message)
  VALUES (p_item_id, a.id, v_message)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'id', v_id, 'status', 'pending');
EXCEPTION
  WHEN unique_violation THEN
    PERFORM api_error(409, 'You already have an active request for this item');
END;
$$;

-- p_action: 'approve' | 'decline' | 'return'. Only the lender may act.
CREATE OR REPLACE FUNCTION update_lending_request(p_user_id text, p_request_id text, p_action text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a      users := actor(p_user_id);
  v_req  lending_requests;
  v_item lending_items;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('approve', 'decline', 'return') THEN
    PERFORM api_error(400, 'Choose approve, decline, or return');
  END IF;
  SELECT * INTO v_req FROM lending_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Borrow request not found');
  END IF;
  SELECT * INTO v_item FROM lending_items WHERE id = v_req.item_id FOR UPDATE;
  IF v_item.owner_id <> a.id THEN
    PERFORM api_error(403, 'Only the lender can update this request');
  END IF;

  IF p_action = 'approve' THEN
    IF v_req.status <> 'pending' OR v_item.status <> 'available' THEN
      PERFORM api_error(409, 'This request can no longer be approved');
    END IF;
    UPDATE lending_items SET status = 'borrowed' WHERE id = v_item.id;
    UPDATE lending_requests SET status = 'approved' WHERE id = v_req.id;
    UPDATE lending_requests SET status = 'declined'
    WHERE item_id = v_item.id AND id <> v_req.id AND status = 'pending';
    RETURN jsonb_build_object('success', true, 'status', 'approved');
  ELSIF p_action = 'decline' THEN
    IF v_req.status <> 'pending' THEN
      PERFORM api_error(409, 'Only pending requests can be declined');
    END IF;
    UPDATE lending_requests SET status = 'declined' WHERE id = v_req.id;
    RETURN jsonb_build_object('success', true, 'status', 'declined');
  ELSE
    IF v_req.status <> 'approved' OR v_item.status <> 'borrowed' THEN
      PERFORM api_error(409, 'This item is not currently lent through this request');
    END IF;
    UPDATE lending_items SET status = 'available' WHERE id = v_item.id;
    UPDATE lending_requests SET status = 'returned' WHERE id = v_req.id;
    RETURN jsonb_build_object('success', true, 'status', 'returned');
  END IF;
END;
$$;

-- =============================================================================
-- Email verification
-- =============================================================================

-- A fresh 6-digit code for the signed-in user, valid 15 minutes. The server
-- emails it; only a hash is stored. One code a minute at most.
CREATE OR REPLACE FUNCTION create_email_code(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a      users := actor(p_actor_id);
  v_code text := lpad(((('x' || encode(gen_random_bytes(4), 'hex'))::bit(32)::bigint) % 1000000)::text, 6, '0');
BEGIN
  IF a.email_verified_at IS NOT NULL THEN
    PERFORM api_error(409, 'Your email is already verified');
  END IF;
  IF EXISTS (SELECT 1 FROM email_verifications WHERE user_id = a.id AND sent_at > now() - interval '60 seconds') THEN
    PERFORM api_error(429, 'A code was sent less than a minute ago. Check your inbox and spam folder.');
  END IF;
  INSERT INTO email_verifications (user_id, code_hash, expires_at)
  VALUES (a.id, token_hash(a.id || ':' || v_code), now() + interval '15 minutes')
  ON CONFLICT (user_id) DO UPDATE
    SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, sent_at = now();
  RETURN jsonb_build_object('code', v_code, 'email', a.email, 'name', a.name);
END;
$$;

-- Five tries per code.
CREATE OR REPLACE FUNCTION verify_email_code(p_actor_id text, p_code text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a users := actor(p_actor_id);
  v email_verifications;
BEGIN
  SELECT * INTO v FROM email_verifications WHERE user_id = a.id FOR UPDATE;
  IF NOT FOUND OR v.expires_at < now() THEN
    PERFORM api_error(400, 'That code has expired. Send a new one.');
  END IF;
  IF v.attempts >= 5 THEN
    PERFORM api_error(429, 'Too many wrong codes. Send a new one.');
  END IF;
  IF v.code_hash <> token_hash(a.id || ':' || trim(p_code)) THEN
    UPDATE email_verifications SET attempts = attempts + 1 WHERE user_id = a.id;
    PERFORM api_error(400, 'That code is not right');
  END IF;
  UPDATE users SET email_verified_at = now() WHERE id = a.id;
  DELETE FROM email_verifications WHERE user_id = a.id;
  RETURN jsonb_build_object('success', true, 'user', user_json(a.id));
END;
$$;

-- =============================================================================
-- Reports and moderation
-- =============================================================================

-- The short label of a board row, for the moderation queue.
CREATE OR REPLACE FUNCTION board_row_label(p_row jsonb) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT left(COALESCE(p_row->>'title', p_row->>'brand', p_row->>'name' || ' · ' || (p_row->>'blood_type')), 140);
$$;

CREATE OR REPLACE FUNCTION report_post(
  p_actor_id text, p_board text, p_row_id text, p_reason text, p_details text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a       users := actor(p_actor_id);
  v_owner text;
  v_uni   text;
  v_rows  int;
BEGIN
  IF NOT p_board = ANY (board_tables()) THEN
    PERFORM api_error(404, 'Unknown board');
  END IF;
  EXECUTE format('SELECT user_id, university_id FROM %I WHERE id = $1', p_board)
    INTO v_owner, v_uni USING p_row_id;
  IF v_owner IS NULL OR v_uni IS DISTINCT FROM a.university_id THEN
    PERFORM api_error(404, 'Not found');
  END IF;
  IF v_owner = a.id THEN
    PERFORM api_error(400, 'You cannot report your own post. Delete it instead.');
  END IF;
  INSERT INTO reports (board, row_id, reporter_id, university_id, reason, details)
  VALUES (p_board, p_row_id, a.id, v_uni, p_reason, NULLIF(trim(p_details), ''));

  -- Three open reports from different students hide the post until an
  -- administrator looks at it. The owner and admins can still see it.
  IF (SELECT count(*) FROM reports WHERE board = p_board AND row_id = p_row_id AND status = 'open') >= 3 THEN
    EXECUTE format('UPDATE %I SET hidden_at = now() WHERE id = $1 AND hidden_at IS NULL', p_board) USING p_row_id;
    GET DIAGNOSTICS v_rows = ROW_COUNT;   -- EXECUTE does not set FOUND
    IF v_rows > 0 THEN
      PERFORM log_moderation(v_uni, NULL, 'auto_hide', p_board, p_row_id, v_owner, '3 reports');
    END IF;
  END IF;
  RETURN jsonb_build_object('success', true, 'message', 'Thanks. An administrator will review it.');
EXCEPTION
  WHEN unique_violation THEN
    PERFORM api_error(409, 'You have already reported this post');
END;
$$;

-- Open reports at the admin's university, one entry per reported post.
CREATE OR REPLACE FUNCTION list_reports(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  a     users := require_admin(p_actor_id);
  r     record;
  v_row jsonb;
  v_out jsonb := '[]'::jsonb;
BEGIN
  FOR r IN
    SELECT board, row_id, count(*)::int AS reports, min(created_at) AS first_reported,
           jsonb_agg(DISTINCT reason) AS reasons,
           jsonb_agg(details ORDER BY created_at) FILTER (WHERE details IS NOT NULL) AS details
    FROM reports
    WHERE status = 'open' AND university_id IS NOT DISTINCT FROM a.university_id
    GROUP BY board, row_id
    ORDER BY count(*) DESC, min(created_at)
    LIMIT 100
  LOOP
    EXECUTE format('SELECT to_jsonb(t) FROM %I t WHERE id = $1', r.board) INTO v_row USING r.row_id;
    v_out := v_out || jsonb_build_object(
      'board', r.board, 'row_id', r.row_id, 'reports', r.reports, 'reasons', r.reasons,
      'details', COALESCE(r.details, '[]'::jsonb), 'first_reported', r.first_reported,
      'label', board_row_label(v_row),
      'excerpt', left(COALESCE(v_row->>'description', v_row->>'feedback', ''), 280),
      'posted_by', COALESCE(v_row->>'posted_by', v_row->>'seller', v_row->>'name'),
      'owner_id', v_row->>'user_id',
      'owner_suspended', EXISTS (SELECT 1 FROM users WHERE id = v_row->>'user_id' AND suspended_at IS NOT NULL),
      'hidden', v_row->>'hidden_at' IS NOT NULL,
      'gone', v_row IS NULL OR (v_row ? 'deleted_at' AND v_row->>'deleted_at' IS NOT NULL)
    );
  END LOOP;
  RETURN v_out;
END;
$$;

-- p_action: 'dismiss' keeps the post; 'remove' deletes it (soft for notices
-- and complaints). Either way the post's open reports are closed.
CREATE OR REPLACE FUNCTION resolve_reports(p_actor_id text, p_board text, p_row_id text, p_action text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a       users := require_admin(p_actor_id);
  v_owner text;
BEGIN
  IF p_action NOT IN ('dismiss', 'remove') THEN
    PERFORM api_error(400, 'Choose dismiss or remove');
  END IF;
  IF NOT p_board = ANY (board_tables()) THEN
    PERFORM api_error(404, 'Unknown board');
  END IF;
  EXECUTE format('SELECT user_id FROM %I WHERE id = $1', p_board) INTO v_owner USING p_row_id;
  IF p_action = 'dismiss' THEN
    EXECUTE format('UPDATE %I SET hidden_at = NULL WHERE id = $1', p_board) USING p_row_id;
  END IF;
  PERFORM log_moderation(a.university_id, a.id, p_action, p_board, p_row_id, v_owner, NULL);
  IF p_action = 'remove' THEN
    BEGIN
      PERFORM delete_board_row(p_board, a.id, p_row_id);
    EXCEPTION WHEN SQLSTATE 'CS404' THEN
      NULL; -- already gone
    END;
  END IF;
  UPDATE reports SET status = CASE WHEN p_action = 'remove' THEN 'removed' ELSE 'dismissed' END,
                     resolved_by = a.id, resolved_at = now()
  WHERE board = p_board AND row_id = p_row_id AND status = 'open';
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Suspend a student at the admin's university: they are signed out everywhere
-- and can't sign in or post until an admin lifts it. Admins can't be suspended.
CREATE OR REPLACE FUNCTION suspend_user(p_actor_id text, p_user_id text, p_reason text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  a users := require_admin(p_actor_id);
  t users;
BEGIN
  SELECT * INTO t FROM users WHERE id = p_user_id;
  IF NOT FOUND OR t.university_id IS DISTINCT FROM a.university_id THEN
    PERFORM api_error(404, 'Not found');
  END IF;
  IF t.role = 'admin' THEN
    PERFORM api_error(400, 'Administrators cannot be suspended');
  END IF;
  IF t.suspended_at IS NOT NULL THEN
    PERFORM api_error(409, 'Already suspended');
  END IF;
  UPDATE users SET suspended_at = now(), suspended_reason = NULLIF(left(trim(p_reason), 300), '') WHERE id = t.id;
  UPDATE auth_sessions SET revoked_at = now() WHERE user_id = t.id AND revoked_at IS NULL;
  PERFORM log_moderation(a.university_id, a.id, 'suspend', NULL, NULL, t.id, p_reason);
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION unsuspend_user(p_actor_id text, p_user_id text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := require_admin(p_actor_id);
BEGIN
  UPDATE users SET suspended_at = NULL, suspended_reason = NULL
  WHERE id = p_user_id AND suspended_at IS NOT NULL AND university_id IS NOT DISTINCT FROM a.university_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Not found');
  END IF;
  PERFORM log_moderation(a.university_id, a.id, 'unsuspend', NULL, NULL, p_user_id, NULL);
  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION list_suspended(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := require_admin(p_actor_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'name', name, 'department', department,
                                        'suspended_at', suspended_at, 'reason', suspended_reason)
                     ORDER BY suspended_at DESC)
    FROM users WHERE suspended_at IS NOT NULL AND university_id IS NOT DISTINCT FROM a.university_id
  ), '[]'::jsonb);
END;
$$;

-- The last 200 moderation steps at the admin's university, newest first.
CREATE OR REPLACE FUNCTION list_moderation_log(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE a users := require_admin(p_actor_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY x->>'at' DESC) FROM (
      SELECT jsonb_build_object('id', l.id, 'at', l.created_at, 'action', l.action, 'board', l.board,
                                'row_id', l.row_id, 'detail', l.detail,
                                'actor', COALESCE(ac.name, 'Automatic'), 'target', tg.name) AS x
      FROM moderation_log l
      LEFT JOIN users ac ON ac.id = l.actor_id
      LEFT JOIN users tg ON tg.id = l.target_user_id
      WHERE l.university_id IS NOT DISTINCT FROM a.university_id
      ORDER BY l.created_at DESC
      LIMIT 200
    ) s
  ), '[]'::jsonb);
END;
$$;

-- =============================================================================
-- Assistant
-- =============================================================================

-- Posts matching a free-text query, for the AI assistant. Only what the
-- student could already see: their university, not hidden by reports (unless
-- it is their own), not removed. Phone numbers, emails and internal ids are
-- never returned, so they never reach the AI provider. p_boards is limited by
-- the server to the modules that are switched on.
CREATE OR REPLACE FUNCTION assistant_search(p_actor_id text, p_query text, p_boards text[], p_limit int)
RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  a       users := actor(p_actor_id);
  v_words text[];
  v_all   jsonb := '[]'::jsonb;
  v_part  jsonb;
  t       text;
  v_owner text;
BEGIN
  -- Words of two or more characters; nothing to search for means "latest".
  SELECT COALESCE(array_agg(DISTINCT w), '{}') INTO v_words
  FROM unnest(regexp_split_to_array(lower(left(COALESCE(p_query, ''), 200)), '[^[:alnum:]+#-]+')) AS w
  WHERE length(w) >= 2;

  FOREACH t IN ARRAY p_boards LOOP
    IF NOT (t = ANY (board_tables()) OR t = 'lending_items') THEN
      CONTINUE;
    END IF;
    v_owner := CASE WHEN t = 'lending_items' THEN 'owner_id' ELSE 'user_id' END;
    EXECUTE format($q$
      SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
                 'board', %L,
                 'id', j->>'id',
                 'post', j - 'id' - 'user_id' - 'owner_id' - 'university_id' - 'phone' - 'contact_number'
                           - 'deleted_at' - 'deleted_by' - 'hidden_at' - 'updated_at' - 'rented_by',
                 'score', (SELECT count(*) FROM unnest($2::text[]) w
                            WHERE lower((SELECT string_agg(value, ' ') FROM jsonb_each_text(
                                    j - 'id' - 'user_id' - 'owner_id' - 'university_id' - 'phone' - 'contact_number'))) LIKE '%%' || w || '%%')
               ) AS r
        FROM (SELECT to_jsonb(x) AS j FROM %I x
               WHERE x.university_id IS NOT DISTINCT FROM $1.university_id
               ORDER BY x.created_at DESC
               LIMIT 500) s
        WHERE (j->>'deleted_at') IS NULL
          AND ((j->>'hidden_at') IS NULL OR j->>%L = $1.id)
      ) q
      WHERE cardinality($2::text[]) = 0 OR (r->>'score')::int > 0
    $q$, t, t, v_owner)
    INTO v_part USING a, v_words;
    v_all := v_all || v_part;
  END LOOP;

  RETURN COALESCE((
    SELECT jsonb_agg(e - 'score' ORDER BY (e->>'score')::int DESC, e->'post'->>'created_at' DESC)
    FROM (SELECT e FROM jsonb_array_elements(v_all) e
          ORDER BY (e->>'score')::int DESC, e->'post'->>'created_at' DESC
          LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20)) s
  ), '[]'::jsonb);
END;
$$;

-- =============================================================================
-- Your data: export and account deletion
-- =============================================================================

CREATE OR REPLACE FUNCTION export_account(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  a     users := actor(p_actor_id);
  t     text;
  v     jsonb;
  posts jsonb := '{}'::jsonb;
BEGIN
  FOREACH t IN ARRAY board_tables() LOOP
    EXECUTE format('SELECT COALESCE(jsonb_agg(to_jsonb(x) - ''user_id'' ORDER BY x.created_at), ''[]''::jsonb)
                      FROM %I x WHERE user_id = $1', t)
      INTO v USING a.id;
    posts := posts || jsonb_build_object(t, v);
  END LOOP;
  RETURN jsonb_build_object(
    'exported_at', now(),
    'account', user_json(a.id) || jsonb_build_object(
      'created_at', a.created_at, 'email_verified_at', a.email_verified_at,
      'privacy_accepted_at', a.privacy_accepted_at),
    'posts', posts,
    'lending_items', COALESCE((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.created_at) FROM lending_items i WHERE owner_id = a.id), '[]'::jsonb),
    'borrow_requests', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at) FROM lending_requests r WHERE requester_id = a.id), '[]'::jsonb),
    'reports_made', COALESCE((SELECT jsonb_agg(jsonb_build_object('board', board, 'reason', reason, 'details', details,
                               'status', status, 'created_at', created_at) ORDER BY created_at)
                             FROM reports WHERE reporter_id = a.id), '[]'::jsonb),
    'sessions', COALESCE((SELECT jsonb_agg(jsonb_build_object('created_at', created_at, 'expires_at', expires_at,
                           'revoked_at', revoked_at, 'user_agent', user_agent) ORDER BY created_at)
                         FROM auth_sessions WHERE user_id = a.id), '[]'::jsonb)
  );
END;
$$;

-- Deletes the account and everything it posted. Needs the password.
CREATE OR REPLACE FUNCTION delete_account(p_actor_id text, p_password text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE a users := actor(p_actor_id);
BEGIN
  IF a.password_hash <> crypt(p_password, a.password_hash) THEN
    PERFORM api_error(401, 'Password is incorrect');
  END IF;
  IF a.role = 'admin' AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin' AND id <> a.id) THEN
    PERFORM api_error(409, 'You are the only administrator. Make someone else an admin first.');
  END IF;
  DELETE FROM users WHERE id = a.id;
  RETURN jsonb_build_object('success', true, 'message', 'Your account and everything you posted have been deleted.');
END;
$$;

