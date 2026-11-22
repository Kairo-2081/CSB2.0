import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The database lives entirely in schema.sql (tables, seed data and every
// function). This file only validates requests and calls those functions.

const PORT = Number(process.env.PORT) || 3001;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/csb2';
// CSB 2.0 opens at BUET first. Add slugs here (comma-separated) to open more campuses.
const OPEN_UNIVERSITY_SLUGS = (process.env.OPEN_UNIVERSITIES || 'buet')
  .split(',')
  .map((slug) => slug.trim().toLowerCase())
  .filter(Boolean);

const pool = new pg.Pool({ connectionString: DATABASE_URL });
let dbReady = false;

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (!dbReady && req.path !== '/api/health') {
    return res.status(503).json({ success: false, error: 'Database is not ready. Please try again in a moment.' });
  }
  next();
});

// ========== DATABASE ==========

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  } finally {
    client.release();
  }
  dbReady = true;
  console.log('✅ Database initialized from schema.sql');
}

// Call one function from schema.sql and return its jsonb result.
// `fn` is always a constant name from this file, never user input.
async function call(fn, ...args) {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(`SELECT ${fn}(${placeholders}) AS result`, args);
  return rows[0].result;
}

// schema.sql raises SQLSTATE 'CSnnn' for client errors, where nnn is the HTTP status.
function sendError(res, error, fallback) {
  if (/^CS\d{3}$/.test(error.code || '')) {
    return res.status(Number(error.code.slice(2))).json({ success: false, error: error.message });
  }
  if (error.code === '23505') {
    return res.status(409).json({ success: false, error: 'That record already exists' });
  }
  // not-null, check, bad number/date/text input
  if (['23502', '23514', '22P02', '22007', '22008', '22003', '22001'].includes(error.code)) {
    return res.status(400).json({ success: false, error: 'Some fields are missing or invalid' });
  }
  console.error(`${fallback}:`, error);
  return res.status(500).json({ success: false, error: fallback });
}

// Wrap a handler: it returns the response body; `status` sets the success code.
const route = (fallback, handler, status = 200) => async (req, res) => {
  try {
    const body = await handler(req, res);
    if (!res.headersSent) res.status(status).json(body);
  } catch (error) {
    sendError(res, error, fallback);
  }
};

const clientError = (status, message) =>
  Object.assign(new Error(message), { code: `CS${status}` });

function bearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.substring(7) : null;
}

async function sessionUserId(req) {
  const token = bearerToken(req);
  return token ? call('session_user_id', token) : null;
}

// ========== VALIDATION ==========

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[@$!%*?&]/.test(password)
  );
}

const text = (value) => (typeof value === 'string' ? value : value == null ? null : String(value));

// ========== HEALTH ==========

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: dbReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString(),
  });
});

// ========== AUTHENTICATION ==========

app.post('/api/auth/login', route('Internal server error', async (req) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw clientError(400, 'Email and password are required');
  return call('login_user', text(email), text(password));
}));

app.post('/api/auth/register', route('Failed to create account', async (req) => {
  const { name, email, password, phone, department, universityName, homeDistrict, currentResidence } = req.body || {};
  const required = [name, email, password, phone, department, universityName, homeDistrict, currentResidence];
  if (required.some((field) => typeof field !== 'string' || !field.trim())) {
    throw clientError(400, 'Name, email, password, phone, university, department, home district, and current residence are required');
  }
  if (!validateEmail(email.trim().toLowerCase())) throw clientError(400, 'Invalid email format');
  if (!validatePassword(password)) {
    throw clientError(400, 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character');
  }
  return call(
    'register_user',
    name, email, password, phone, department, universityName, homeDistrict, currentResidence,
    OPEN_UNIVERSITY_SLUGS,
  );
}, 201));

app.get('/api/auth/verify', route('Verification failed', async (req) => {
  const token = bearerToken(req);
  if (!token) throw clientError(401, 'A valid session is required');
  return call('verify_session', token);
}));

app.post('/api/auth/logout', route('Failed to sign out', async (req) => {
  const token = bearerToken(req);
  if (token) await call('end_session', token);
  return { success: true };
}));

app.put('/api/auth/profile/:id', route('Failed to update profile', async (req) => {
  const actorId = await sessionUserId(req);
  if (!actorId) throw clientError(401, 'A valid session is required');
  const allowed = ['name', 'phone', 'department'];
  const updates = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key, value]) => allowed.includes(key) && typeof value === 'string'),
  );
  if (Object.keys(updates).length === 0) throw clientError(400, 'No supported profile fields were provided');
  return call('update_profile', actorId, req.params.id, updates.name ?? null, updates.phone ?? null, updates.department ?? null);
}));

app.post('/api/auth/change-password', route('Failed to change password', async (req) => {
  const { userId, oldPassword, newPassword } = req.body || {};
  if (!userId || !oldPassword || !newPassword) throw clientError(400, 'All fields are required');
  if (!validatePassword(newPassword)) throw clientError(400, 'New password does not meet security requirements');
  return call('change_password', text(userId), text(oldPassword), text(newPassword));
}));

app.get('/api/auth/users', route('Failed to load users', () => call('list_users')));

// ========== UNIVERSITIES & STATS ==========

app.get('/api/universities', route('Failed to load universities', () =>
  call('list_open_universities', OPEN_UNIVERSITY_SLUGS)));

app.get('/api/public/campus-stats', route('Failed to load campus stats', () =>
  call('campus_stats', 'buet')));

app.get('/api/admin/metrics', route('Failed to load university metrics', async (req) =>
  call('admin_metrics', await sessionUserId(req))));

// ========== CAMPUS BOARDS ==========

app.get('/api/notices', route('Failed to load notices', () => call('list_notices')));
app.post('/api/notices', route('Failed to post notice', (req) => {
  const b = req.body || {};
  return call('create_notice', text(b.title), text(b.description), text(b.category), text(b.posted_by), text(b.user_id));
}));
app.delete('/api/notices/:id', route('Failed to delete notice', (req) => call('delete_notice', req.params.id)));

app.get('/api/complaints', route('Failed to load complaints', () => call('list_complaints')));
app.post('/api/complaints', route('Failed to post complaint', (req) => {
  const b = req.body || {};
  return call('create_complaint', text(b.title), text(b.description), text(b.category), text(b.posted_by), text(b.user_id));
}));
app.delete('/api/complaints/:id', route('Failed to delete complaint', (req) => {
  const { userId, userRole } = req.body || {};
  return call('delete_complaint', req.params.id, text(userId), text(userRole));
}));

app.get('/api/faculty-suggestions', route('Failed to load suggestions', () => call('list_faculty_suggestions')));
app.post('/api/faculty-suggestions', route('Failed to submit suggestion', (req) => {
  const b = req.body || {};
  return call(
    'create_faculty_suggestion',
    text(b.title), text(b.faculty_name), text(b.subject), parseInt(b.rating, 10),
    text(b.feedback), text(b.posted_by), text(b.user_id),
  );
}));
app.delete('/api/faculty-suggestions/:id', route('Failed to delete suggestion', (req) =>
  call('delete_faculty_suggestion', req.params.id)));

app.get('/api/marketplace', route('Failed to load listings', () => call('list_marketplace')));
app.post('/api/marketplace', route('Failed to post item', async (req) => {
  const b = req.body || {};
  if (!Number.isFinite(Number(b.price)) || Number(b.price) < 0) throw clientError(400, 'Enter a valid price');
  return call(
    'create_marketplace_item',
    text(b.title), text(b.description), Number(b.price), text(b.category),
    text(b.seller), text(b.phone), text(b.user_id),
  );
}));
app.delete('/api/marketplace/:id', route('Failed to delete item', (req) => {
  const { userId, userRole } = req.body || {};
  return call('delete_marketplace_item', req.params.id, text(userId), text(userRole));
}));

app.get('/api/lost-found', route('Failed to load items', () => call('list_lost_found')));
app.post('/api/lost-found', route('Failed to post item', (req) => {
  const b = req.body || {};
  return call(
    'create_lost_found_item',
    text(b.title), text(b.description), text(b.item_type), text(b.status),
    text(b.location), text(b.contact_number), text(b.posted_by), text(b.user_id),
  );
}));
app.delete('/api/lost-found/:id', route('Failed to delete item', (req) => call('delete_lost_found_item', req.params.id)));

app.get('/api/bicycles', route('Failed to load bicycles', () => call('list_bicycles')));
app.post('/api/bicycles', route('Failed to add bicycle', (req) => {
  const b = req.body || {};
  return call(
    'create_bicycle',
    text(b.brand), text(b.color), text(b.location), text(b.contact_number), text(b.description), text(b.user_id),
  );
}));
app.delete('/api/bicycles/:id', route('Failed to delete bicycle', (req) => call('delete_bicycle', req.params.id)));

app.get('/api/blood-donation', route('Failed to load donors', () => call('list_blood_donors')));
app.post('/api/blood-donation', route('Failed to register donor', (req) => {
  const b = req.body || {};
  return call(
    'create_blood_donor',
    text(b.name), text(b.blood_type), text(b.contact_number), text(b.location),
    text(b.available_date) || null, text(b.user_id),
  );
}));
app.delete('/api/blood-donation/:id', route('Failed to delete donor entry', (req) => {
  const { userId, userRole } = req.body || {};
  return call('delete_blood_donor', req.params.id, text(userId), text(userRole));
}));

app.get('/api/animal-welfare', route('Failed to load reports', () => call('list_animal_reports')));
app.post('/api/animal-welfare', route('Failed to submit report', (req) => {
  const b = req.body || {};
  return call(
    'create_animal_report',
    text(b.title), text(b.description), text(b.location), text(b.urgency), text(b.posted_by), text(b.user_id),
  );
}));
app.delete('/api/animal-welfare/:id', route('Failed to delete report', (req) => call('delete_animal_report', req.params.id)));

// ========== LEND & BORROW ==========

app.get('/api/lend-borrow/items', route('Failed to load lending listings', async (req) =>
  call('list_lending_items', await sessionUserId(req))));

app.post('/api/lend-borrow/items', route('Failed to create lending listing', async (req) => {
  const b = req.body || {};
  return call(
    'create_lending_item',
    await sessionUserId(req), text(b.title), text(b.description), text(b.category),
    text(b.itemCondition), text(b.handoffLocation),
  );
}, 201));

app.get('/api/lend-borrow/requests', route('Failed to load borrow requests', async (req) =>
  call('list_lending_requests', await sessionUserId(req))));

app.post('/api/lend-borrow/items/:id/requests', route('Failed to send borrow request', async (req) =>
  call('request_to_borrow', await sessionUserId(req), req.params.id, text(req.body?.message)), 201));

app.patch('/api/lend-borrow/requests/:id', route('Failed to update borrow request', async (req) =>
  call('update_lending_request', await sessionUserId(req), req.params.id, text(req.body?.action))));

// Error handling middleware (must come after the routes)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ========== START ==========

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║  🚀 Campus Hub Backend Server Ready    ║
║  URL: http://localhost:${PORT}            ║
║  Database: PostgreSQL (schema.sql)     ║
╚════════════════════════════════════════╝
      `);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('   Set DATABASE_URL to a reachable PostgreSQL database (see DATABASE_SETUP.md).');
    process.exit(1);
  });
