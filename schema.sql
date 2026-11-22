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

-- =============================================================================
-- Campus boards. list_* return newest first; create_* return the new row.
-- =============================================================================

-- Shared delete rule for boards that check ownership: admins delete anything,
-- everyone else only their own rows.
CREATE OR REPLACE FUNCTION check_can_delete(
  p_owner_id text, p_user_id text, p_user_role text, p_what text
) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(p_user_role, '') <> 'admin' AND p_owner_id IS DISTINCT FROM p_user_id THEN
    PERFORM api_error(403, 'Unauthorized: You can only delete your own ' || p_what);
  END IF;
END;
$$;

-- ---- Notices ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION list_notices() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC), '[]'::jsonb) FROM notices n;
$$;

CREATE OR REPLACE FUNCTION create_notice(
  p_title text, p_description text, p_category text, p_posted_by text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r notices;
BEGIN
  INSERT INTO notices (title, description, category, posted_by, user_id)
  VALUES (p_title, p_description, p_category, p_posted_by, p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_notice(p_id text) RETURNS jsonb
LANGUAGE sql AS $$
  DELETE FROM notices WHERE id = p_id;
  SELECT jsonb_build_object('success', true, 'message', 'Notice deleted successfully');
$$;

-- ---- Complaints -------------------------------------------------------------

CREATE OR REPLACE FUNCTION list_complaints() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.created_at DESC), '[]'::jsonb) FROM complaints c;
$$;

CREATE OR REPLACE FUNCTION create_complaint(
  p_title text, p_description text, p_category text, p_posted_by text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r complaints;
BEGIN
  INSERT INTO complaints (title, description, category, posted_by, user_id)
  VALUES (p_title, p_description, p_category, p_posted_by, p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_complaint(p_id text, p_user_id text, p_user_role text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_owner text;
BEGIN
  SELECT user_id INTO v_owner FROM complaints WHERE id = p_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Complaint not found');
  END IF;
  PERFORM check_can_delete(v_owner, p_user_id, p_user_role, 'complaints');
  DELETE FROM complaints WHERE id = p_id;
  RETURN jsonb_build_object('success', true, 'message', 'Complaint deleted successfully');
END;
$$;

-- ---- Faculty suggestions ----------------------------------------------------

CREATE OR REPLACE FUNCTION list_faculty_suggestions() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(f) ORDER BY f.created_at DESC), '[]'::jsonb) FROM faculty_suggestions f;
$$;

CREATE OR REPLACE FUNCTION create_faculty_suggestion(
  p_title text, p_faculty_name text, p_subject text, p_rating int,
  p_feedback text, p_posted_by text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r faculty_suggestions;
BEGIN
  INSERT INTO faculty_suggestions (title, faculty_name, subject, rating, feedback, posted_by, user_id)
  VALUES (p_title, p_faculty_name, NULLIF(trim(p_subject), ''), p_rating, p_feedback,
          NULLIF(trim(p_posted_by), ''), p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_faculty_suggestion(p_id text) RETURNS jsonb
LANGUAGE sql AS $$
  DELETE FROM faculty_suggestions WHERE id = p_id;
  SELECT jsonb_build_object('success', true, 'message', 'Suggestion deleted successfully');
$$;

-- ---- Marketplace ------------------------------------------------------------

CREATE OR REPLACE FUNCTION list_marketplace() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.created_at DESC), '[]'::jsonb) FROM marketplace m;
$$;

CREATE OR REPLACE FUNCTION create_marketplace_item(
  p_title text, p_description text, p_price numeric, p_category text,
  p_seller text, p_phone text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r marketplace;
BEGIN
  INSERT INTO marketplace (title, description, price, category, seller, phone, user_id)
  VALUES (p_title, p_description, p_price, COALESCE(NULLIF(trim(p_category), ''), 'Other'),
          p_seller, p_phone, p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_marketplace_item(p_id text, p_user_id text, p_user_role text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_owner text;
BEGIN
  SELECT user_id INTO v_owner FROM marketplace WHERE id = p_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Item not found');
  END IF;
  PERFORM check_can_delete(v_owner, p_user_id, p_user_role, 'items');
  DELETE FROM marketplace WHERE id = p_id;
  RETURN jsonb_build_object('success', true, 'message', 'Item deleted successfully');
END;
$$;

-- ---- Lost & found -----------------------------------------------------------

CREATE OR REPLACE FUNCTION list_lost_found() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC), '[]'::jsonb) FROM lost_found l;
$$;

CREATE OR REPLACE FUNCTION create_lost_found_item(
  p_title text, p_description text, p_item_type text, p_status text,
  p_location text, p_contact_number text, p_posted_by text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r lost_found;
BEGIN
  INSERT INTO lost_found (title, description, item_type, status, location, contact_number, posted_by, user_id)
  VALUES (p_title, p_description, p_item_type, COALESCE(p_status, p_item_type, 'lost'), p_location,
          NULLIF(trim(p_contact_number), ''), NULLIF(trim(p_posted_by), ''), p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_lost_found_item(p_id text) RETURNS jsonb
LANGUAGE sql AS $$
  DELETE FROM lost_found WHERE id = p_id;
  SELECT jsonb_build_object('success', true, 'message', 'Item deleted successfully');
$$;

-- ---- Bicycles ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION list_bicycles() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC), '[]'::jsonb) FROM bicycles b;
$$;

CREATE OR REPLACE FUNCTION create_bicycle(
  p_brand text, p_color text, p_location text, p_contact_number text,
  p_description text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r bicycles;
BEGIN
  INSERT INTO bicycles (brand, color, location, contact_number, description, user_id)
  VALUES (p_brand, p_color, p_location, p_contact_number, p_description, p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_bicycle(p_id text) RETURNS jsonb
LANGUAGE sql AS $$
  DELETE FROM bicycles WHERE id = p_id;
  SELECT jsonb_build_object('success', true, 'message', 'Report deleted successfully');
$$;

-- ---- Blood donation ---------------------------------------------------------

CREATE OR REPLACE FUNCTION list_blood_donors() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY d.created_at DESC), '[]'::jsonb) FROM blood_donation d;
$$;

CREATE OR REPLACE FUNCTION create_blood_donor(
  p_name text, p_blood_type text, p_contact_number text, p_location text,
  p_available_date date, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r blood_donation;
BEGIN
  INSERT INTO blood_donation (name, blood_type, contact_number, location, available_date, user_id)
  VALUES (p_name, p_blood_type, p_contact_number, p_location,
          COALESCE(p_available_date, current_date), p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_blood_donor(p_id text, p_user_id text, p_user_role text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE v_owner text;
BEGIN
  SELECT user_id INTO v_owner FROM blood_donation WHERE id = p_id;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Donor entry not found');
  END IF;
  PERFORM check_can_delete(v_owner, p_user_id, p_user_role, 'donor entries');
  DELETE FROM blood_donation WHERE id = p_id;
  RETURN jsonb_build_object('success', true, 'message', 'Donor entry deleted successfully');
END;
$$;

-- ---- Animal welfare ---------------------------------------------------------

CREATE OR REPLACE FUNCTION list_animal_reports() RETURNS jsonb
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC), '[]'::jsonb) FROM animal_welfare a;
$$;

CREATE OR REPLACE FUNCTION create_animal_report(
  p_title text, p_description text, p_location text, p_urgency text,
  p_posted_by text, p_user_id text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r animal_welfare;
BEGIN
  INSERT INTO animal_welfare (title, description, location, urgency, posted_by, user_id)
  VALUES (p_title, p_description, p_location, COALESCE(p_urgency, 'medium'),
          NULLIF(trim(p_posted_by), ''), p_user_id)
  RETURNING * INTO r;
  RETURN to_jsonb(r);
END;
$$;

CREATE OR REPLACE FUNCTION delete_animal_report(p_id text) RETURNS jsonb
LANGUAGE sql AS $$
  DELETE FROM animal_welfare WHERE id = p_id;
  SELECT jsonb_build_object('success', true, 'message', 'Report deleted successfully');
$$;

-- =============================================================================
-- Lend & borrow (scoped to the signed-in student's university)
-- =============================================================================

CREATE OR REPLACE FUNCTION require_user_university(p_user_id text) RETURNS text
LANGUAGE plpgsql STABLE AS $$
DECLARE v_university text;
BEGIN
  IF p_user_id IS NULL THEN
    PERFORM api_error(401, 'A valid session is required');
  END IF;
  SELECT university_id INTO v_university FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN
    PERFORM api_error(401, 'User not found');
  END IF;
  RETURN v_university;
END;
$$;

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

-- Available items at the student's university, plus the student's own items.
CREATE OR REPLACE FUNCTION list_lending_items(p_user_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE v_university text := require_user_university(p_user_id);
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(lending_item_json(i.id, p_user_id) ORDER BY i.created_at DESC)
    FROM lending_items i
    WHERE i.university_id IS NOT DISTINCT FROM v_university
      AND (i.status = 'available' OR i.owner_id = p_user_id)
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION create_lending_item(
  p_user_id text, p_title text, p_description text, p_category text,
  p_item_condition text, p_handoff_location text
) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_university text := require_user_university(p_user_id);
  v_id text;
BEGIN
  IF COALESCE(trim(p_title), '') = '' OR COALESCE(trim(p_description), '') = ''
     OR COALESCE(trim(p_category), '') = '' OR COALESCE(trim(p_item_condition), '') = ''
     OR COALESCE(trim(p_handoff_location), '') = '' THEN
    PERFORM api_error(400, 'Complete all listing fields before posting');
  END IF;
  IF length(trim(p_title)) > 100 OR length(trim(p_description)) > 1200
     OR length(trim(p_handoff_location)) > 120 THEN
    PERFORM api_error(400, 'One or more fields exceed the allowed length');
  END IF;

  INSERT INTO lending_items (title, description, category, item_condition, handoff_location, owner_id, university_id)
  VALUES (trim(p_title), trim(p_description), trim(p_category), trim(p_item_condition),
          trim(p_handoff_location), p_user_id, v_university)
  RETURNING id INTO v_id;

  RETURN lending_item_json(v_id, p_user_id);
END;
$$;

-- Requests the student sent or received.
CREATE OR REPLACE FUNCTION list_lending_requests(p_user_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
DECLARE v_university text := require_user_university(p_user_id);
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
    WHERE i.university_id IS NOT DISTINCT FROM v_university
      AND (r.requester_id = p_user_id OR i.owner_id = p_user_id)
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION request_to_borrow(p_user_id text, p_item_id text, p_message text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_university text := require_user_university(p_user_id);
  v_owner text;
  v_id text;
  v_message text := NULLIF(trim(COALESCE(p_message, '')), '');
BEGIN
  SELECT owner_id INTO v_owner FROM lending_items
  WHERE id = p_item_id
    AND university_id IS NOT DISTINCT FROM v_university
    AND status = 'available';
  IF NOT FOUND THEN
    PERFORM api_error(404, 'This item is no longer available');
  END IF;
  IF v_owner = p_user_id THEN
    PERFORM api_error(400, 'You cannot request to borrow your own item');
  END IF;
  IF length(v_message) > 500 THEN
    PERFORM api_error(400, 'Request message must be 500 characters or fewer');
  END IF;

  INSERT INTO lending_requests (item_id, requester_id, message)
  VALUES (p_item_id, p_user_id, v_message)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id, 'status', 'pending');
EXCEPTION
  WHEN unique_violation THEN
    PERFORM api_error(409, 'You already have an active request for this item');
END;
$$;

-- p_action: 'approve' | 'decline' | 'return'. Only the lender may act.
-- Approving lends the item and declines every other pending request for it.
CREATE OR REPLACE FUNCTION update_lending_request(p_user_id text, p_request_id text, p_action text) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE
  v_req   lending_requests;
  v_item  lending_items;
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('approve', 'decline', 'return') THEN
    PERFORM api_error(400, 'Choose approve, decline, or return');
  END IF;
  IF p_user_id IS NULL THEN
    PERFORM api_error(401, 'A valid session is required');
  END IF;

  SELECT * INTO v_req FROM lending_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    PERFORM api_error(404, 'Borrow request not found');
  END IF;
  SELECT * INTO v_item FROM lending_items WHERE id = v_req.item_id FOR UPDATE;
  IF v_item.owner_id <> p_user_id THEN
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
