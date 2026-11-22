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
