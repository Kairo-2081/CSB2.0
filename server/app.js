import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import { schemas } from './schemas.js';
import { config } from './config.js';

// The database lives entirely in schema.sql. This file checks who is asking,
// validates the body, calls one function, and passes the result through.

export const SESSION_COOKIE = 'csb_session';
const SESSION_DAYS = 7;

// Routes anyone may call. Everything else under /api needs a session.
export const PUBLIC_ROUTES = new Set([
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/register',
  'POST /api/auth/logout',
  'GET /api/universities',
  'GET /api/public/campus-stats',
  'GET /api/modules',
]);

// Map each module to the URL prefix of its API, for MODULES feature flags.
const MODULE_PREFIXES = {
  notices: '/api/notices',
  complaints: '/api/complaints',
  marketplace: '/api/marketplace',
  'lost-found': '/api/lost-found',
  bicycles: '/api/bicycles',
  'blood-donation': '/api/blood-donation',
  'animal-welfare': '/api/animal-welfare',
  'faculty-suggestions': '/api/faculty-suggestions',
  'lend-borrow': '/api/lend-borrow',
  students: '/api/students',
};

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function createApp({ pool, log = console }) {
  // Call one function from schema.sql and return its jsonb result.
  // `fn` is always a constant from this file, never user input.
  async function call(fn, ...args) {
    const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(`SELECT ${fn}(${placeholders}) AS result`, args);
    return rows[0].result;
  }

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // ---- Request id and access log --------------------------------------------
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.setHeader('X-Request-Id', req.id);
    const started = Date.now();
    res.on('finish', () => {
      if (!req.path.startsWith('/api')) return;
      log.info(JSON.stringify({
        level: res.statusCode >= 500 ? 'error' : 'info',
        msg: 'request', requestId: req.id, method: req.method, path: req.path,
        status: res.statusCode, ms: Date.now() - started, user: req.user?.id,
      }));
    });
    next();
  });

  // ---- Security headers -------------------------------------------------------
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'", 'data:'],
        'script-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': config.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // ---- CORS: only listed origins get CORS headers ------------------------------
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
  }));

  // ---- CSRF guard: state-changing requests must come from our own pages -------
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    if (!origin) return next(); // same-origin form posts and non-browser clients
    let host;
    try {
      host = new URL(origin).host;
    } catch {
      return res.status(403).json({ success: false, error: 'Request origin not allowed' });
    }
    if (host === req.get('host') || config.corsOrigins.includes(origin)) return next();
    return res.status(403).json({ success: false, error: 'Request origin not allowed' });
  });

  app.use(express.json({ limit: '50kb' }));

  // ---- Rate limits ------------------------------------------------------------
  const limiter = (windowMs, limit, message) => rateLimit({
    windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { success: false, error: message },
  });
  app.use('/api', limiter(60_000, config.rateLimit.general, 'Too many requests. Try again in a minute.'));
  app.use(['/api/auth/login', '/api/auth/change-password'],
    limiter(15 * 60_000, config.rateLimit.login, 'Too many attempts. Try again in 15 minutes.'));
  app.use('/api/auth/register', limiter(60 * 60_000, config.rateLimit.register, 'Too many sign-ups from here. Try again later.'));

  // ---- Health (before the auth gate; checks the database) ----------------------
  let dbReady = false;
  app.locals.setDbReady = (v) => { dbReady = v; };
  app.get('/api/health', async (req, res) => {
    if (!dbReady) return res.status(503).json({ success: false, status: 'starting', database: 'initializing' });
    try {
      await pool.query('SELECT 1');
      res.json({ success: true, status: 'ok', database: 'ready', timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ success: false, status: 'degraded', database: 'unreachable' });
    }
  });

  app.use('/api', (req, res, next) => {
    if (!dbReady) return res.status(503).json({ success: false, error: 'Starting up. Try again in a moment.' });
    next();
  });

  // ---- Module flags -------------------------------------------------------------
  app.get('/api/modules', (req, res) => res.json({ success: true, modules: config.modules }));
  app.use((req, res, next) => {
    for (const [name, prefix] of Object.entries(MODULE_PREFIXES)) {
      if (req.path.startsWith(prefix) && !config.modules.includes(name)) {
        return res.status(404).json({ success: false, error: 'This service is not available yet' });
      }
    }
    next();
  });

  // ---- Authentication: default deny ---------------------------------------------
  function sessionToken(req) {
    const cookieToken = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (cookieToken) return cookieToken;
    const header = req.get('authorization') || '';
    return header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  async function requireAuth(req, res, next) {
    try {
      const token = sessionToken(req);
      const user = token ? await call('session_user_info', token) : null;
      if (!user) return res.status(401).json({ success: false, error: 'Sign in required' });
      req.user = user;
      req.sessionToken = token;
      next();
    } catch (error) {
      next(error);
    }
  }

  app.use('/api', (req, res, next) => {
    const key = `${req.method} /api${req.path}`.replace(/\/$/, '');
    return PUBLIC_ROUTES.has(key) ? next() : requireAuth(req, res, next);
  });

  // ---- Helpers ------------------------------------------------------------------
  const route = (handler, status = 200) => async (req, res, next) => {
    try {
      const body = await handler(req, res);
      if (!res.headersSent) res.status(status).json(body);
    } catch (error) {
      next(error);
    }
  };
  const parse = (schema, value) => schema.parse(value ?? {});
  const page = (req) => {
    const q = parse(schemas.page, req.query);
    return [q.limit ?? null, q.before ?? null];
  };

  function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
  }
  // The token goes only into the HttpOnly cookie, never into the response body.
  const withoutToken = ({ token: _token, ...rest }) => rest;

  // ---- Auth routes --------------------------------------------------------------
  app.post('/api/auth/login', route(async (req, res) => {
    const b = parse(schemas.login, req.body);
    const result = await call('login_user', b.email, b.password, req.get('user-agent') || null);
    setSessionCookie(res, result.token);
    return withoutToken(result);
  }));

  app.post('/api/auth/register', route(async (req, res) => {
    const b = parse(schemas.register, req.body);
    const domain = b.email.split('@')[1] || '';
    if (config.emailDomains.length && !config.emailDomains.some((d) => domain === d || domain.endsWith(`.${d}`))) {
      throw new AppError(400, `Sign up with your university email (${config.emailDomains.map((d) => `@${d}`).join(', ')}).`);
    }
    const result = await call(
      'register_user', b.name, b.email, b.password, b.phone, b.department, b.universityName,
      b.homeDistrict, b.currentResidence, config.openUniversities, req.get('user-agent') || null,
    );
    setSessionCookie(res, result.token);
    return withoutToken(result);
  }, 201));

  app.post('/api/auth/logout', route(async (req, res) => {
    const token = sessionToken(req);
    if (token) await call('end_session', token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { success: true };
  }));

  app.get('/api/auth/verify', route((req) => call('verify_session', req.user.id)));

  app.put('/api/auth/profile/:id', route((req) => {
    const b = parse(schemas.profile, req.body);
    return call('update_profile', req.user.id, req.params.id, b.name ?? null, b.phone ?? null,
      b.department ?? null, b.showContact ?? null);
  }));

  app.post('/api/auth/change-password', route((req) => {
    const b = parse(schemas.changePassword, req.body);
    return call('change_password', req.user.id, b.oldPassword, b.newPassword, req.sessionToken);
  }));

  // The student directory: same university only, contact details by opt-in.
  app.get('/api/students', route((req) => {
    const q = parse(schemas.directoryQuery, req.query);
    return call('list_directory', req.user.id, q.q ?? null, q.limit ?? null, q.offset ?? null);
  }));

  // ---- Universities and stats ---------------------------------------------------
  app.get('/api/universities', route(() => call('list_open_universities', config.openUniversities)));
  app.get('/api/public/campus-stats', route(() => call('campus_stats', config.launchCampus)));
  app.get('/api/admin/metrics', route((req) => call('admin_metrics', req.user.id)));
  app.get('/api/admin/removed', route((req) => call('list_removed', req.user.id)));

  // ---- Campus boards ------------------------------------------------------------
  // path -> [table, create function, schema, argument order]
  const boards = {
    notices: ['notices', 'create_notice', schemas.notice, (b) => [b.title, b.description, b.category]],
    complaints: ['complaints', 'create_complaint', schemas.complaint,
      (b) => [b.title, b.description, b.category, b.anonymous]],
    'faculty-suggestions': ['faculty_suggestions', 'create_faculty_suggestion', schemas.facultySuggestion,
      (b) => [b.title, b.faculty_name, b.subject ?? null, b.rating, b.feedback, b.anonymous]],
    marketplace: ['marketplace', 'create_marketplace_item', schemas.marketplace,
      (b) => [b.title, b.description, b.price, b.category ?? null, b.phone ?? null]],
    'lost-found': ['lost_found', 'create_lost_found_item', schemas.lostFound,
      (b) => [b.title, b.description, b.item_type, b.location, b.contact_number ?? null]],
    bicycles: ['bicycles', 'create_bicycle', schemas.bicycle,
      (b) => [b.brand, b.color ?? null, b.location ?? null, b.contact_number ?? null, b.description ?? null]],
    'blood-donation': ['blood_donation', 'create_blood_donor', schemas.bloodDonor,
      (b) => [b.blood_type, b.contact_number, b.location, b.available_date ?? null]],
    'animal-welfare': ['animal_welfare', 'create_animal_report', schemas.animalReport,
      (b) => [b.title, b.description, b.location, b.urgency]],
  };

  for (const [pathName, [table, createFn, schema, args]] of Object.entries(boards)) {
    app.get(`/api/${pathName}`, route((req) => call('list_board', table, req.user.id, ...page(req))));
    app.post(`/api/${pathName}`, route((req) => call(createFn, req.user.id, ...args(parse(schema, req.body))), 201));
    app.delete(`/api/${pathName}/:id`, route((req) => call('delete_board_row', table, req.user.id, req.params.id)));
  }
  app.post('/api/notices/:id/restore', route((req) => call('restore_board_row', 'notices', req.user.id, req.params.id)));
  app.post('/api/complaints/:id/restore', route((req) => call('restore_board_row', 'complaints', req.user.id, req.params.id)));

  // ---- Lend & borrow ------------------------------------------------------------
  app.get('/api/lend-borrow/items', route((req) => call('list_lending_items', req.user.id, ...page(req))));
  app.post('/api/lend-borrow/items', route((req) => {
    const b = parse(schemas.lendingItem, req.body);
    return call('create_lending_item', req.user.id, b.title, b.description, b.category, b.itemCondition, b.handoffLocation);
  }, 201));
  app.get('/api/lend-borrow/requests', route((req) => call('list_lending_requests', req.user.id)));
  app.post('/api/lend-borrow/items/:id/requests', route((req) => {
    const b = parse(schemas.borrowRequest, req.body);
    return call('request_to_borrow', req.user.id, req.params.id, b.message ?? null);
  }, 201));
  app.patch('/api/lend-borrow/requests/:id', route((req) => {
    const b = parse(schemas.lendingAction, req.body);
    return call('update_lending_request', req.user.id, req.params.id, b.action);
  }));

  // ---- Unknown API paths --------------------------------------------------------
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `No API route for ${req.method} ${req.originalUrl}` });
  });

  // ---- Frontend -----------------------------------------------------------------
  const distDir = path.join(config.rootDir, 'dist');
  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir, { index: false, maxAge: '1h' }));
    app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  } else {
    app.get('/', (req, res) => {
      res.type('text').send('CSB 2.0 API is running. Build the frontend with `npm run build`, or use `npm run dev`.');
    });
  }

  // ---- Errors (after every route) -------------------------------------------------
  // Deliberate errors keep their message; anything else becomes a generic 500
  // with a request id, and the full error goes to the log under the same id.
  app.use((error, req, res, _next) => {
    if (error instanceof ZodError) {
      const issue = error.issues[0];
      const field = issue?.path?.join('.') || 'request';
      return res.status(400).json({ success: false, error: `Check the ${field} field: ${issue?.message ?? 'invalid value'}` });
    }
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    if (/^CS\d{3}$/.test(error.code || '')) {
      return res.status(Number(error.code.slice(2))).json({ success: false, error: error.message });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ success: false, error: 'Request is too large' });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, error: 'Request body is not valid JSON' });
    }
    if (['23505'].includes(error.code)) {
      return res.status(409).json({ success: false, error: 'That record already exists' });
    }
    if (['23502', '23503', '23514', '22P02', '22007', '22008', '22003', '22001'].includes(error.code)) {
      return res.status(400).json({ success: false, error: 'Some fields are missing or invalid' });
    }
    log.error(JSON.stringify({
      level: 'error', msg: error.message, requestId: req.id, path: req.path, code: error.code, stack: error.stack,
    }));
    return res.status(500).json({ success: false, error: 'Something went wrong', requestId: req.id });
  });

  return { app, call };
}

export async function initializeDatabase(pool) {
  const client = await pool.connect();
  try {
    await client.query(fs.readFileSync(path.join(config.rootDir, 'schema.sql'), 'utf8'));
  } finally {
    client.release();
  }
}
