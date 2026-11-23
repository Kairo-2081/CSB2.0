/* global window, document, localStorage */
// Regenerates the screenshots in README.md from a throwaway local database.
//
//   createdb csb2_readme
//   npm run build
//   DATABASE_URL=postgresql://localhost/csb2_readme PORT=3001 node server.js &
//   DATABASE_URL=postgresql://localhost/csb2_readme node scripts/capture-readme-screens.mjs
//
// It loads scripts/readme-sample-data.sql (150 invented students, about a year
// of posts), creates an administrator, does a little moderation so the admin
// screens have something to show, then captures every screen in dark and
// light. Refuses to run against anything but localhost.
import { readFile, mkdir } from "node:fs/promises";
import pg from "pg";
import { chromium } from "@playwright/test";

const BASE = process.env.README_BASE_URL || "http://localhost:3001";
const DB = process.env.DATABASE_URL;
const OUT = process.env.README_OUT || ".github/assets/readme/raw";
if (!DB || !/@(localhost|127\.0\.0\.1)[:/]|^postgres(ql)?:\/\/localhost/.test(DB) || !/localhost|127\.0\.0\.1/.test(BASE)) {
  console.error("Refusing: DATABASE_URL and README_BASE_URL must point at localhost.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DB });
const { rows } = await pool.query("SELECT count(*)::int AS n FROM users WHERE email LIKE '%@demo.invalid'");
if (rows[0].n === 0) await pool.query(await readFile(new URL("./readme-sample-data.sql", import.meta.url), "utf8"));

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

// An administrator to sign in as.
const admin = { name: "Rumana Haque", email: `admin.${Date.now()}@buet.ac.bd`, password: `Aa1!${crypto.randomUUID()}` }; // throwaway, never printed
const setup = await browser.newContext();
const sp = await setup.newPage();
await sp.goto(BASE + "/");
const reg = await sp.evaluate(async (a) => {
  const r = await fetch("/api/auth/register", {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: a.name, email: a.email, password: a.password, phone: "01000000000", department: "Computer Science and Engineering",
      universityName: "BUET", homeDistrict: "Dhaka", currentResidence: "Ahsanullah Hall", consent: true }),
  });
  return r.json();
}, admin);
await pool.query("UPDATE users SET role = 'admin', created_at = now() - interval '200 days' WHERE id = $1", [reg.user.id]);
const user = { ...reg.user, role: "admin" };

// A little moderation so the admin page has a log and a suspension.
const call = (path, body) => sp.evaluate(async ([p, b]) => (await fetch(p, { method: "POST", credentials: "include",
  headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).status, [path, body]);
const open = (await pool.query("SELECT board, row_id FROM reports WHERE status = 'open' ORDER BY created_at LIMIT 2")).rows;
if (open[0]) await call("/api/admin/reports/resolve", { board: open[0].board, row_id: open[0].row_id, action: "dismiss" });
const target = (await pool.query("SELECT id FROM users WHERE email LIKE '%@demo.invalid' AND suspended_at IS NULL ORDER BY name LIMIT 1")).rows[0];
if (target) await call(`/api/admin/users/${target.id}/suspend`, { reason: "Repeated duplicate listings" });

const desktop = ["dashboard", "notices", "lost-found", "marketplace", "lend-borrow", "complaints", "blood-donation", "profile", "admin", "central-admin"];
for (const theme of ["dark", "light"]) {
  const suffix = theme === "light" ? "-light" : "";
  // Public pages, signed out.
  const pub = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const pp = await pub.newPage();
  await pp.addInitScript((t) => localStorage.setItem("csb-theme", t), theme);
  for (const [name, path] of [["home", "/"], ["auth", "/auth"], ["privacy", "/privacy"]]) {
    await pp.goto(BASE + path); await pp.waitForTimeout(2200);
    await pp.screenshot({ path: `${OUT}/csb-${name}${suffix}.png` });
  }
  await pp.goto(BASE + "/"); await pp.waitForTimeout(800);
  await pp.evaluate(() => document.getElementById("services")?.scrollIntoView()); await pp.waitForTimeout(1200);
  await pp.screenshot({ path: `${OUT}/csb-services${suffix}.png` });
  await pub.close();

  // Signed in as the administrator.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, storageState: await setup.storageState() });
  const page = await ctx.newPage();
  await page.addInitScript(([t, u]) => { localStorage.setItem("csb-theme", t); localStorage.setItem("user", u); }, [theme, JSON.stringify(user)]);
  for (const name of desktop) {
    await page.goto(`${BASE}/${name}`); await page.waitForTimeout(2600);
    if (["marketplace", "lend-borrow"].includes(name)) { await page.mouse.wheel(0, 360); await page.waitForTimeout(900); }
    if (name === "central-admin") {
      // The moderation tools: reported posts, suspensions and the log.
      await page.evaluate(() => {
        const el = document.getElementById("reports");
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
      });
      await page.waitForTimeout(1200);
    }
    await page.screenshot({ path: `${OUT}/app-${name}${suffix}.png` });
  }
  await ctx.close();

  // Phone.
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, storageState: await setup.storageState() });
  const mp = await phone.newPage();
  await mp.addInitScript(([t, u]) => { localStorage.setItem("csb-theme", t); localStorage.setItem("user", u); }, [theme, JSON.stringify(user)]);
  for (const name of ["dashboard", "marketplace"]) {
    await mp.goto(`${BASE}/${name}`); await mp.waitForTimeout(2400);
    if (name === "marketplace") { await mp.mouse.wheel(0, 700); await mp.waitForTimeout(900); }
    await mp.screenshot({ path: `${OUT}/phone-${name}${suffix}.png` });
  }
  await phone.close();
}
await browser.close();
await pool.end();
console.log(`Saved to ${OUT}. Convert to JPEG with scripts/readme-images.py.`);
