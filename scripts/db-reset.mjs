// Drops every table and function in the public schema, then rebuilds from schema.sql.
// Development only: this deletes all data.
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = process.env.DATABASE_URL || 'postgresql://localhost:5432/csb2';
if (/supabase\.co|amazonaws|render\.com|neon\.tech/.test(url) && process.env.FORCE !== '1') {
  console.error('Refusing to reset what looks like a hosted database. Set FORCE=1 if you really mean it.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
await client.query(fs.readFileSync(path.join(root, 'schema.sql'), 'utf8'));
await client.end();
console.log('Database rebuilt from schema.sql');
