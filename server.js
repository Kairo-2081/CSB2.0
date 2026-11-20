import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const authSessions = new Map();
const UNIVERSITY_CATALOG = [
  { name: 'Bangladesh University of Engineering and Technology', shortName: 'BUET', division: 'Dhaka' },
  { name: 'Rajshahi University of Engineering and Technology', shortName: 'RUET', division: 'Rajshahi' },
  { name: 'University of Dhaka', shortName: 'DU', division: 'Dhaka' },
  { name: 'University of Rajshahi', shortName: 'RU', division: 'Rajshahi' },
  { name: 'University of Chittagong', shortName: 'CU', division: 'Chattogram' },
  { name: 'Jahangirnagar University', shortName: 'JU', division: 'Dhaka' },
  { name: 'Khulna University', shortName: 'KU', division: 'Khulna' },
  { name: 'Shahjalal University of Science and Technology', shortName: 'SUST', division: 'Sylhet' },
  { name: 'Chittagong University of Engineering and Technology', shortName: 'CUET', division: 'Chattogram' },
  { name: 'Khulna University of Engineering and Technology', shortName: 'KUET', division: 'Khulna' },
  { name: 'Dhaka University of Engineering and Technology', shortName: 'DUET', division: 'Dhaka' },
  { name: 'Bangladesh Agricultural University', shortName: 'BAU', division: 'Mymensingh' },
];

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database
let db;
let dbReady = false;

async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, 'campus-hub.db'),
    driver: sqlite3.Database,
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      phone TEXT,
      department TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_name TEXT,
      division TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_universities_name
      ON universities(name COLLATE NOCASE);

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      posted_by TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      posted_by TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marketplace (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      seller TEXT NOT NULL,
      phone TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS animal_welfare (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      urgency TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faculty_suggestions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      feedback TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blood_donation (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      blood_type TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      location TEXT NOT NULL,
      available_date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bicycles (
      id TEXT PRIMARY KEY,
      brand TEXT NOT NULL,
      color TEXT NOT NULL,
      location TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      description TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lost_found (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      item_type TEXT NOT NULL,
      status TEXT DEFAULT 'lost',
      location TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userColumns = await db.all('PRAGMA table_info(users)');
  const existingUserColumns = new Set(userColumns.map((column) => column.name));
  for (const [column, definition] of [
    ['university_id', 'TEXT'],
    ['home_district', 'TEXT'],
    ['current_residence', 'TEXT'],
  ]) {
    if (!existingUserColumns.has(column)) {
      await db.exec(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
    }
  }

  for (const university of UNIVERSITY_CATALOG) {
    const slug = university.shortName.toLowerCase();
    await db.run(
      `INSERT OR IGNORE INTO universities (id, name, slug, short_name, division)
       VALUES (?, ?, ?, ?, ?)`,
      [slug, university.name, slug, university.shortName, university.division]
    );
  }

  // Insert default users (Admin + 5 Students)
  try {
    const existingUsers = await db.all('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count === 0) {
      const defaultUsers = [
        // Admin User
        { id: 'admin_1', name: 'Admin User', email: 'admin@campushub.com', password: 'Admin@123', role: 'admin', phone: '9876543210', department: 'Administration' },
        // Student Users
        { id: 'student_1', name: 'Raj Kumar', email: 'raj@student.com', password: 'Student@123', role: 'student', phone: '9876543211', department: 'Computer Science' },
        { id: 'student_2', name: 'Priya Singh', email: 'priya@student.com', password: 'Student@123', role: 'student', phone: '9876543212', department: 'Engineering' },
        { id: 'student_3', name: 'Amit Patel', email: 'amit@student.com', password: 'Student@123', role: 'student', phone: '9876543213', department: 'Business' },
        { id: 'student_4', name: 'Neha Sharma', email: 'neha@student.com', password: 'Student@123', role: 'student', phone: '9876543214', department: 'Medicine' },
        { id: 'student_5', name: 'Arjun Verma', email: 'arjun@student.com', password: 'Student@123', role: 'student', phone: '9876543215', department: 'Law' }
      ];

      for (const user of defaultUsers) {
        await db.run(
          'INSERT INTO users (id, name, email, password, role, phone, department, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [user.id, user.name, user.email, user.password, user.role, user.phone, user.department, new Date().toISOString(), new Date().toISOString()]
        );
      }
      console.log('✅ Default users created');
    }
  } catch (error) {
    console.log('Users already exist or error:', error.message);
  }

  dbReady = true;
  console.log('✅ Database initialized successfully');
}

// Database ready check middleware
app.use((req, res, next) => {
  if (!dbReady && req.path !== '/api/health') {
    return res.status(503).json({
      success: false,
      error: 'Database is not ready. Please try again in a moment.'
    });
  }
  next();
});

// ========== HEALTH CHECK ==========

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: dbReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString()
  });
});

// ========== AUTHENTICATION ==========

// Generate UUID
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[@$!%*?&]/.test(password)
  );
}

function createAuthToken(userId) {
  const token = randomBytes(32).toString('hex');
  authSessions.set(token, {
    userId,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
  });
  return token;
}

function getAuthenticatedUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const session = authSessions.get(token);
  if (!session) {
    return null;
  }
  if (session.expiresAt <= Date.now()) {
    authSessions.delete(token);
    return null;
  }
  return session.userId;
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    const user = await db.get(
      `SELECT users.*, universities.name AS university_name
       FROM users
       LEFT JOIN universities ON universities.id = users.university_id
       WHERE lower(users.email) = lower(?) AND users.password = ?`,
      [email, password]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    res.json({
      success: true,
      token: createAuthToken(user.id),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        universityId: user.university_id,
        universityName: user.university_name,
        homeDistrict: user.home_district,
        currentResidence: user.current_residence
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, department, universityName, homeDistrict, currentResidence } = req.body;
    const requiredFields = [name, email, password, phone, department, universityName, homeDistrict, currentResidence];

    if (
      requiredFields.some((field) => typeof field !== 'string' || !field.trim())
    ) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, phone, university, department, home district, and current residence are required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
      });
    }

    // Check if email already exists
    const id = generateId();
    const now = new Date().toISOString();
    const normalizedUniversityName = universityName.trim().replace(/\s+/g, ' ');
    const slugBase = normalizedUniversityName
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `university-${Date.now()}`;

    await db.exec('BEGIN IMMEDIATE');
    let university;
    try {
      const existingUser = await db.get(
        'SELECT id FROM users WHERE lower(email) = ?',
        [normalizedEmail]
      );
      if (existingUser) {
        await db.exec('ROLLBACK');
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      university = await db.get(
        'SELECT id, name FROM universities WHERE name = ? COLLATE NOCASE AND is_active = 1',
        [normalizedUniversityName]
      );

      if (!university) {
        const slug = `${slugBase}-${Date.now().toString(36)}`;
        university = {
          id: slug,
          name: normalizedUniversityName,
        };
        await db.run(
          `INSERT INTO universities (id, name, slug, short_name, division)
           VALUES (?, ?, ?, NULL, NULL)`,
          [university.id, university.name, slug]
        );
      }

      await db.run(
        `INSERT INTO users (
          id, name, email, password, role, phone, department,
          university_id, home_district, current_residence, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name.trim(),
          normalizedEmail,
          password,
          phone.trim(),
          department.trim(),
          university.id,
          homeDistrict.trim(),
          currentResidence.trim(),
          now,
          now,
        ]
      );
      await db.exec('COMMIT');
    } catch (error) {
      await db.exec('ROLLBACK');
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      token: createAuthToken(id),
      user: {
        id,
        name,
        email: normalizedEmail,
        role: 'student',
        phone: phone.trim(),
        department: department.trim(),
        universityId: university.id,
        universityName: university.name,
        homeDistrict: homeDistrict.trim(),
        currentResidence: currentResidence.trim()
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

// Verify auth endpoint (optional)
app.get('/api/auth/verify', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'A valid session is required'
      });
    }

    const user = await db.get(
      `SELECT users.*, universities.name AS university_name
       FROM users
       LEFT JOIN universities ON universities.id = users.university_id
       WHERE users.id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        universityId: user.university_id,
        universityName: user.university_name,
        homeDistrict: user.home_district,
        currentResidence: user.current_residence
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Verification failed' 
    });
  }
});

app.get('/api/universities', async (req, res) => {
  try {
    const universities = await db.all(
      `SELECT id, name, short_name AS shortName, division
       FROM universities
       WHERE is_active = 1
       ORDER BY name COLLATE NOCASE`
    );
    res.json({ success: true, universities });
  } catch (error) {
    console.error('University list error:', error);
    res.status(500).json({ success: false, error: 'Failed to load universities' });
  }
});

app.get('/api/admin/metrics', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication is required' });
    }

    const account = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
    if (!account) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    if (account.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Central administrator access is required' });
    }

    const universities = await db.all(
      `SELECT
        universities.id,
        universities.name,
        universities.short_name AS shortName,
        universities.division,
        COUNT(CASE WHEN users.role = 'student' THEN users.id END) AS studentCount,
        COUNT(CASE
          WHEN users.role = 'student'
            AND strftime('%Y-%m', users.created_at) = strftime('%Y-%m', 'now')
          THEN users.id
        END) AS studentsThisMonth
      FROM universities
      LEFT JOIN users ON users.university_id = universities.id
      WHERE universities.is_active = 1
      GROUP BY universities.id
      ORDER BY studentCount DESC, universities.name COLLATE NOCASE`
    );
    const totals = await db.get(
      `SELECT
        COUNT(*) AS universityCount,
        COALESCE(SUM(studentCount), 0) AS studentCount,
        COALESCE(SUM(studentsThisMonth), 0) AS studentsThisMonth
      FROM (
        SELECT
          universities.id,
          COUNT(CASE WHEN users.role = 'student' THEN users.id END) AS studentCount,
          COUNT(CASE
            WHEN users.role = 'student'
              AND strftime('%Y-%m', users.created_at) = strftime('%Y-%m', 'now')
            THEN users.id
          END) AS studentsThisMonth
        FROM universities
        LEFT JOIN users ON users.university_id = universities.id
        WHERE universities.is_active = 1
        GROUP BY universities.id
      ) AS university_totals`
    );

    res.json({ success: true, ...totals, universities });
  } catch (error) {
    console.error('Admin metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to load university metrics' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    const user = await db.get(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.password !== oldPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'New password does not meet security requirements'
      });
    }

    const now = new Date().toISOString();
    await db.run(
      'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
      [newPassword, now, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

// Get all users (for demo/testing)
app.get('/api/auth/users', async (req, res) => {
  try {
    const users = await db.all('SELECT id, name, email, role, phone, department FROM users');
    res.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== COMPLAINTS ==========
app.get('/api/complaints', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM complaints ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/complaints', async (req, res) => {
  try {
    const { title, description, category, posted_by, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO complaints (id, title, description, category, posted_by, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, category, posted_by, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.body;

    // Get complaint details
    const complaint = await db.get('SELECT * FROM complaints WHERE id = ?', [id]);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check authorization: Admin can delete any, student can only delete own
    if (userRole !== 'admin' && complaint.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own complaints' });
    }

    await db.run('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== NOTICES ==========
app.get('/api/notices', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM notices ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notices', async (req, res) => {
  try {
    const { title, description, category, posted_by, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO notices (id, title, description, category, posted_by, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, category, posted_by, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM notices WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM notices WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MARKETPLACE ==========
app.get('/api/marketplace', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM marketplace ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/marketplace', async (req, res) => {
  try {
    const { title, description, price, seller, phone, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO marketplace (id, title, description, price, seller, phone, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, parseFloat(price), seller, phone, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM marketplace WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/marketplace/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.body;

    // Get marketplace item details
    const item = await db.get('SELECT * FROM marketplace WHERE id = ?', [id]);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check authorization: Admin can delete any, student can only delete own
    if (userRole !== 'admin' && item.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own items' });
    }

    await db.run('DELETE FROM marketplace WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ANIMAL WELFARE ==========
app.get('/api/animal-welfare', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM animal_welfare ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/animal-welfare', async (req, res) => {
  try {
    const { title, description, location, urgency, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO animal_welfare (id, title, description, location, urgency, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, location, urgency, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM animal_welfare WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/animal-welfare/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM animal_welfare WHERE id = ?', [id]);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== FACULTY SUGGESTIONS ==========
app.get('/api/faculty-suggestions', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM faculty_suggestions ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/faculty-suggestions', async (req, res) => {
  try {
    const { title, faculty_name, rating, feedback, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO faculty_suggestions (id, title, faculty_name, rating, feedback, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, faculty_name, parseInt(rating), feedback, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM faculty_suggestions WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/faculty-suggestions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM faculty_suggestions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Suggestion deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BLOOD DONATION ==========
app.get('/api/blood-donation', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM blood_donation ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blood-donation', async (req, res) => {
  try {
    const { name, blood_type, contact_number, location, available_date, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO blood_donation (id, name, blood_type, contact_number, location, available_date, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, blood_type, contact_number, location, available_date, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM blood_donation WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blood-donation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.body;

    // Get donor details
    const donor = await db.get('SELECT * FROM blood_donation WHERE id = ?', [id]);
    
    if (!donor) {
      return res.status(404).json({ error: 'Donor record not found' });
    }

    // Check authorization: Admin can delete any, user can only delete own
    if (userRole !== 'admin' && donor.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own records' });
    }

    await db.run('DELETE FROM blood_donation WHERE id = ?', [id]);
    res.json({ success: true, message: 'Donor record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== BICYCLES ==========
app.get('/api/bicycles', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM bicycles ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bicycles', async (req, res) => {
  try {
    const { brand, color, location, contact_number, description, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO bicycles (id, brand, color, location, contact_number, description, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, brand, color, location, contact_number, description, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM bicycles WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bicycles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM bicycles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== LOST & FOUND ==========
app.get('/api/lost-found', async (req, res) => {
  try {
    const data = await db.all('SELECT * FROM lost_found ORDER BY created_at DESC');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/lost-found', async (req, res) => {
  try {
    const { title, description, item_type, status, location, contact_number, user_id } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    await db.run(
      'INSERT INTO lost_found (id, title, description, item_type, status, location, contact_number, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, description, item_type, status || 'lost', location, contact_number, user_id, created_at, created_at]
    );

    const result = await db.get('SELECT * FROM lost_found WHERE id = ?', [id]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lost-found/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM lost_found WHERE id = ?', [id]);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚀 Campus Hub Backend Server Ready    ║
║  URL: http://localhost:${PORT}            ║
║  Database: SQLite (campus-hub.db)     ║
╚════════════════════════════════════════╝
    `);
  });
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});
