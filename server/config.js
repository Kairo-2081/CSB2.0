// All configuration comes from the environment. Defaults suit local development.
import path from 'path';
import { fileURLToPath } from 'url';

const list = (value, fallback) =>
  (value ?? fallback).split(',').map((s) => s.trim()).filter(Boolean);

const ALL_MODULES = [
  'notices', 'complaints', 'marketplace', 'lost-found', 'bicycles', 'blood-donation',
  'animal-welfare', 'faculty-suggestions', 'lend-borrow', 'students',
];

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

export const config = {
  rootDir: path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  isProduction,
  port: Number(env.PORT) || 3001,
  databaseUrl: env.DATABASE_URL || 'postgresql://localhost:5432/csb2',
  databaseSsl: env.DATABASE_SSL === 'true',
  // Number of proxies in front of the app (Render: 1). Needed for real client IPs.
  trustProxy: env.TRUST_PROXY !== undefined ? Number(env.TRUST_PROXY) : (isProduction ? 1 : 0),
  // Origins allowed to call the API from another site. Same-origin needs no entry.
  corsOrigins: list(env.CORS_ORIGINS, isProduction ? '' : 'http://localhost:5173,http://localhost:8080'),
  // University slugs that may register (comma-separated).
  openUniversities: list(env.OPEN_UNIVERSITIES, 'buet').map((s) => s.toLowerCase()),
  launchCampus: (env.LAUNCH_CAMPUS || 'buet').toLowerCase(),
  // Email domains allowed at sign-up; subdomains count (ugrad.cse.buet.ac.bd).
  emailDomains: list(env.ALLOWED_EMAIL_DOMAINS, 'buet.ac.bd').map((s) => s.toLowerCase()),
  // Modules switched on (comma-separated); everything else returns 404.
  modules: list(env.MODULES, ALL_MODULES.join(',')).filter((m) => ALL_MODULES.includes(m)),
  allModules: ALL_MODULES,
  // First administrator, created once when the database has none.
  adminEmail: env.ADMIN_EMAIL || null,
  adminPassword: env.ADMIN_PASSWORD || null,
  // Outgoing mail for verification codes (server/mailer.js). Verification is
  // required whenever mail can be sent, unless REQUIRE_EMAIL_VERIFICATION=false.
  smtpUrl: env.SMTP_URL || null,
  // Brevo's HTTPS email API; preferred over SMTP_URL when both are set.
  brevoApiKey: env.BREVO_API_KEY || null,
  mailFrom: env.MAIL_FROM || 'CSB 2.0 <no-reply@csb.local>',
  get requireEmailVerification() {
    if (env.REQUIRE_EMAIL_VERIFICATION !== undefined) return env.REQUIRE_EMAIL_VERIFICATION === 'true';
    return Boolean(env.BREVO_API_KEY || env.SMTP_URL);
  },
  // AI assistant (server/assistant.js): on when a Groq key is set, unless ASSISTANT=off.
  get groqApiKey() { return env.GROQ_API_KEY || null; },
  // llama-3.3-70b-versatile was shut down on 16 Aug 2026; Groq names gpt-oss-120b as its replacement.
  get groqModel() { return env.GROQ_MODEL || 'openai/gpt-oss-120b'; },
  // Any OpenAI-compatible endpoint; used by tests and local demos.
  get groqBaseUrl() { return (env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''); },
  get assistantEnabled() {
    return Boolean(env.GROQ_API_KEY) && env.ASSISTANT !== 'off';
  },
  rateLimit: {
    assistant: Number(env.RATE_LIMIT_ASSISTANT) || 30,
    general: Number(env.RATE_LIMIT_GENERAL) || 300,
    login: Number(env.RATE_LIMIT_LOGIN) || 8,
    register: Number(env.RATE_LIMIT_REGISTER) || 10,
  },
};
