-- CSB 2.0 database schema (SQLite)
--
-- This is the only place the database is defined. server.js reads this file
-- and runs it on every start, so every statement must be safe to re-run:
-- tables and indexes use IF NOT EXISTS, seed rows use INSERT OR IGNORE.
--
-- Changing a table that already exists in someone's campus-hub.db is NOT
-- handled by re-running this file (SQLite has no ADD COLUMN IF NOT EXISTS).
-- During development, delete campus-hub.db and restart the server.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Universities and people
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS universities (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  short_name  TEXT,
  division    TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_name
  ON universities(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  password           TEXT NOT NULL,
  role               TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  phone              TEXT,
  department         TEXT,
  university_id      TEXT REFERENCES universities(id),
  home_district      TEXT,
  current_residence  TEXT,
  created_at         TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at         TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id);

-- ---------------------------------------------------------------------------
-- Campus boards
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notices (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  posted_by    TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  posted_by    TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty_suggestions (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  faculty_name  TEXT NOT NULL,
  subject       TEXT,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback      TEXT NOT NULL,
  posted_by     TEXT,
  user_id       TEXT NOT NULL,
  created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Things students trade, lend and lose
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketplace (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  price        REAL NOT NULL CHECK (price >= 0),
  category     TEXT NOT NULL DEFAULT 'Other',
  is_sold      INTEGER NOT NULL DEFAULT 0,
  seller       TEXT NOT NULL,
  phone        TEXT NOT NULL,
  user_id      TEXT NOT NULL,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lending_items (
  id                TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category          TEXT NOT NULL,
  item_condition    TEXT NOT NULL,
  handoff_location  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'borrowed')),
  owner_id          TEXT NOT NULL REFERENCES users(id),
  university_id     TEXT REFERENCES universities(id),
  created_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lending_items_university ON lending_items(university_id, status);

CREATE TABLE IF NOT EXISTS lending_requests (
  id            TEXT PRIMARY KEY,
  item_id       TEXT NOT NULL REFERENCES lending_items(id),
  requester_id  TEXT NOT NULL REFERENCES users(id),
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'declined', 'returned')),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One open request per student per item.
CREATE UNIQUE INDEX IF NOT EXISTS idx_lending_active_request
  ON lending_requests(item_id, requester_id)
  WHERE status IN ('pending', 'approved');

CREATE TABLE IF NOT EXISTS lost_found (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  item_type       TEXT NOT NULL CHECK (item_type IN ('lost', 'found')),
  status          TEXT NOT NULL DEFAULT 'lost',
  location        TEXT NOT NULL,
  contact_number  TEXT,
  posted_by       TEXT,
  user_id         TEXT NOT NULL,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bicycles (
  id              TEXT PRIMARY KEY,
  brand           TEXT NOT NULL,
  color           TEXT NOT NULL,
  location        TEXT NOT NULL,
  contact_number  TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'rented', 'maintenance')),
  rented_by       TEXT,
  user_id         TEXT NOT NULL,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Care
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS blood_donation (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  blood_type      TEXT NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  contact_number  TEXT NOT NULL,
  location        TEXT NOT NULL,
  available_date  TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animal_welfare (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  location     TEXT NOT NULL,
  urgency      TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  posted_by    TEXT,
  user_id      TEXT NOT NULL,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Seed: university catalog
-- id = slug = short name in lowercase. Registration is limited to the slugs
-- in OPEN_UNIVERSITIES (default "buet"); the rest are ready for later.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO universities (id, name, slug, short_name, division) VALUES
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
  ('bau',  'Bangladesh Agricultural University',                   'bau',  'BAU',  'Mymensingh');

-- No user accounts are seeded. The first admin is promoted by hand after they
-- register:  UPDATE users SET role = 'admin' WHERE email = '<their email>';
