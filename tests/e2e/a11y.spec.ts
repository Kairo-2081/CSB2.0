import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// Automated accessibility scan (WCAG 2.1 A and AA rules from axe-core) over
// the public pages and every signed-in board, in both themes. Serious and
// critical problems fail the test; the rest are printed for follow-up.
const stamp = Date.now();
const who = { name: `A11y Tester ${stamp}`, email: `a11y-${stamp}@buet.ac.bd`, password: "Passw0rd!x" };

const publicPages = ["/", "/auth", "/privacy"];
const signedIn = [
  "/dashboard", "/notices", "/lost-found", "/lend-borrow", "/marketplace", "/complaints",
  "/bicycles", "/blood-donation", "/animal-welfare", "/faculty-suggestions", "/students", "/profile",
];

async function scan(page: Page, path: string, theme: string) {
  await page.waitForLoadState("networkidle");
  // Let entrance animations finish so colour checks see the final state.
  await page.waitForTimeout(900);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const blocking = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of result.violations) {
    console.log(`[${theme}] ${path} ${v.impact} ${v.id}: ${v.nodes.length} × ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  }
  expect(blocking.map((v) => `${v.id} (${v.nodes.length})`), `${path} in ${theme}`).toEqual([]);
}

async function signUp(page: Page, person = who) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: /register/i }).click();
  await page.getByLabel(/full name/i).fill(person.name);
  await page.getByLabel(/^email/i).last().fill(person.email);
  await page.getByLabel(/contact number/i).fill("01712345678");
  await page.getByLabel(/department/i).selectOption("Computer Science and Engineering");
  await page.getByLabel(/home district/i).fill("Dhaka");
  await page.getByLabel(/current residence/i).fill("Ahsanullah Hall");
  await page.getByLabel(/^password/i).last().fill(person.password);
  const confirm = page.getByLabel(/confirm password/i);
  if (await confirm.count()) await confirm.fill(person.password);
  const consent = page.getByLabel(/privacy/i);
  if (await consent.count()) await consent.check();
  await page.getByRole("button", { name: /create account|register|sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

for (const theme of ["dark", "light"]) {
  test(`public pages pass axe in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("csb-theme", t), theme);
    for (const path of publicPages) {
      await page.goto(path);
      await scan(page, path, theme);
    }
  });
}

test("signed-in pages pass axe in both themes", async ({ page }) => {
  test.setTimeout(180_000);
  await signUp(page);
  for (const theme of ["dark", "light"]) {
    await page.evaluate((t) => localStorage.setItem("csb-theme", t), theme);
    for (const path of signedIn) {
      await page.goto(path);
      await scan(page, path, theme);
    }
  }
});

test("a board that fails to load says so and can retry", async ({ page }) => {
  await signUp(page, { name: `Retry Tester ${stamp}`, email: `retry-${stamp}@buet.ac.bd`, password: "Passw0rd!x" });
  let fail = true;
  await page.route("**/api/notices*", (route) => (fail ? route.abort() : route.continue()));
  await page.goto("/notices");
  await expect(page.getByRole("alert").getByText("Couldn't load this.")).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: /try again/i }).click();
  await expect(page.getByText("Couldn't load this.")).toHaveCount(0);
});
