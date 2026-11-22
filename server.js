import pg from 'pg';
import { createApp, initializeDatabase } from './server/app.js';
import { config } from './server/config.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

const { app, call } = createApp({ pool });

try {
  await initializeDatabase(pool);
  if (config.adminEmail && config.adminPassword) {
    const result = await call('ensure_admin', config.adminEmail, config.adminPassword);
    console.log(JSON.stringify({ level: 'info', msg: `first admin: ${result}` }));
  }
  app.locals.setDbReady(true);
  console.log(JSON.stringify({ level: 'info', msg: 'database ready (schema.sql applied)' }));
} catch (error) {
  console.error(JSON.stringify({ level: 'error', msg: 'failed to initialize database', error: error.message }));
  console.error('Set DATABASE_URL to a reachable PostgreSQL database (see DATABASE_SETUP.md).');
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(JSON.stringify({ level: 'info', msg: `CSB 2.0 listening on http://localhost:${config.port}` }));
});
