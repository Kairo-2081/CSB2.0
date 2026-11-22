-- =============================================================================
-- CSB 2.0 database: PostgreSQL 14+ / PL/pgSQL
--
-- This file is the whole database: extensions, tables, indexes, triggers,
-- seed rows and every function the API calls. server.js holds no SQL besides
-- "SELECT fn(...)". It runs this file on every start, so every statement must
-- be safe to re-run (IF NOT EXISTS, CREATE OR REPLACE, ON CONFLICT DO NOTHING).
--
-- Every function returns jsonb (or nothing), shaped exactly like the API
-- response, so the server can pass results straight through.
--
-- Errors meant for the client are raised with SQLSTATE 'CSnnn', where nnn is
-- the HTTP status the server should answer with (CS400, CS401, CS403, CS404,
-- CS409). The exception message is the text shown to the user.
--
-- CREATE OR REPLACE cannot change a function's argument list or return type.
-- If you change one, add a DROP FUNCTION IF EXISTS for the old signature.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- crypt()/gen_salt() for passwords

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

-- Sign-in sessions. Tokens survive a server restart.
CREATE TABLE IF NOT EXISTS auth_sessions (
  token       text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions (user_id);

-- user_id on the board tables below is plain text, not a foreign key: some
-- pages still post a placeholder id instead of the signed-in user's id.

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
-- Accounts and sessions
-- =============================================================================

-- The user object every auth endpoint returns. Never includes the password.
CREATE OR REPLACE FUNCTION user_json(p_user_id text) RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'id',               u.id,
    'name',             u.name,
    'email',            u.email,
    'role',             u.role,
    'phone',            u.phone,
    'department',       u.department,
    'universityId',     u.university_id,
    'universityName',   un.name,
    'homeDistrict',     u.home_district,
    'currentResidence', u.current_residence
  )
  FROM users u
  LEFT JOIN universities un ON un.id = u.university_id
  WHERE u.id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION create_session(p_user_id text, p_days int DEFAULT 7) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  v_token text := encode(gen_random_bytes(32), 'hex');
BEGIN
  DELETE FROM auth_sessions WHERE expires_at <= now();
  INSERT INTO auth_sessions (token, user_id, expires_at)
  VALUES (v_token, p_user_id, now() + make_interval(days => p_days));
  RETURN v_token;
END;
$$;

-- The signed-in user's id for a bearer token, or NULL if missing or expired.
CREATE OR REPLACE FUNCTION session_user_id(p_token text) RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT user_id FROM auth_sessions
  WHERE token = p_token AND expires_at > now();
$$;

CREATE OR REPLACE FUNCTION end_session(p_token text) RETURNS void
LANGUAGE sql AS $$
  DELETE FROM auth_sessions WHERE token = p_token;
$$;

CREATE OR REPLACE FUNCTION login_user(p_email text, p_password text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_id text;
BEGIN
  SELECT id INTO v_id FROM users
  WHERE lower(email) = lower(trim(p_email))
    AND password_hash = crypt(p_password, password_hash);

  IF v_id IS NULL THEN
    PERFORM api_error(401, 'Invalid email or password');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'token',   create_session(v_id),
    'user',    user_json(v_id)
  );
END;
$$;

-- Format checks (email shape, password strength) happen in the server before
-- this is called; this function enforces the rules that need the database.
CREATE OR REPLACE FUNCTION register_user(
  p_name               text,
  p_email              text,
  p_password           text,
  p_phone              text,
  p_department         text,
  p_university_name    text,
  p_home_district      text,
  p_current_residence  text,
  p_open_slugs         text[]
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
    university_id, home_district, current_residence
  ) VALUES (
    trim(p_name), lower(trim(p_email)), crypt(p_password, gen_salt('bf', 10)), 'student',
    trim(p_phone), trim(p_department),
    v_university_id, trim(p_home_district), trim(p_current_residence)
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'token',   create_session(v_id),
    'user',    user_json(v_id),
    'message', 'Account created successfully'
  );
EXCEPTION
  WHEN unique_violation THEN   -- two sign-ups with one email at the same moment
    PERFORM api_error(409, 'Email already registered');
END;
$$;

CREATE OR REPLACE FUNCTION verify_session(p_token text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_user jsonb := user_json(session_user_id(p_token));
BEGIN
  IF v_user IS NULL THEN
    PERFORM api_error(401, 'A valid session is required');
  END IF;
  RETURN jsonb_build_object('success', true, 'user', v_user);
END;
$$;

-- NULL arguments leave a field unchanged.
CREATE OR REPLACE FUNCTION update_profile(
  p_actor_id    text,
  p_user_id     text,
  p_name        text,
  p_phone       text,
  p_department  text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
BEGIN
  IF p_actor_id IS NULL THEN
    PERFORM api_error(401, 'A valid session is required');
  END IF;
  IF p_actor_id <> p_user_id
     AND NOT EXISTS (SELECT 1 FROM users WHERE id = p_actor_id AND role = 'admin') THEN
    PERFORM api_error(403, 'You can only update your own profile');
  END IF;

  UPDATE users SET
    name       = COALESCE(p_name, name),
    phone      = COALESCE(p_phone, phone),
    department = COALESCE(p_department, department)
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    PERFORM api_error(404, 'User not found');
  END IF;
  RETURN jsonb_build_object('success', true, 'user', user_json(p_user_id));
END;
$$;

CREATE OR REPLACE FUNCTION change_password(p_user_id text, p_old text, p_new text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_hash text;
BEGIN
  SELECT password_hash INTO v_hash FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'User not found');
  END IF;
  IF v_hash <> crypt(p_old, v_hash) THEN
    PERFORM api_error(401, 'Current password is incorrect');
  END IF;

  UPDATE users SET password_hash = crypt(p_new, gen_salt('bf', 10)) WHERE id = p_user_id;
  RETURN jsonb_build_object('success', true, 'message', 'Password changed successfully');
END;
$$;

CREATE OR REPLACE FUNCTION list_users() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('success', true, 'users', COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id, 'name', name, 'email', email, 'role', role,
      'phone', phone, 'department', department
    ) ORDER BY created_at), '[]'::jsonb))
  FROM users;
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

-- Public, aggregate-only counts for the landing page. Notices and lost & found
-- rows carry no university yet; while BUET is the only campus they are BUET's.
CREATE OR REPLACE FUNCTION campus_stats(p_slug text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_campus universities;
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
      'notices',       (SELECT count(*)::int FROM notices),
      'openLostItems', (SELECT count(*)::int FROM lost_found WHERE status = 'lost'),
      'itemsToBorrow', (SELECT count(*)::int FROM lending_items
                        WHERE university_id = v_campus.id AND status = 'available')
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION admin_metrics(p_actor_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_role text;
  v_rows jsonb;
BEGIN
  IF p_actor_id IS NULL THEN
    PERFORM api_error(401, 'Authentication is required');
  END IF;
  SELECT role INTO v_role FROM users WHERE id = p_actor_id;
  IF NOT FOUND THEN
    PERFORM api_error(401, 'User not found');
  END IF;
  IF v_role <> 'admin' THEN
    PERFORM api_error(403, 'Central administrator access is required');
  END IF;

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
