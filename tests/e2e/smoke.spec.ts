import { expect, test } from "@playwright/test";

// One student signs up, posts on two boards, finds themself in the directory
// and signs out. Then a second student checks they cannot delete those posts.
const stamp = Date.now();
const bottle = `Blue water bottle ${stamp}`;
const fan = `Fan broken in room 204 (${stamp})`;
const first = { name: `Smoke Tester ${stamp}`, email: `smoke-${stamp}@buet.ac.bd`, password: "Passw0rd!x" };
const second = { name: `Second Student ${stamp}`, email: `second-${stamp}@buet.ac.bd`, password: "Passw0rd!x" };

async function signUp(page: import("@playwright/test").Page, who: typeof first) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: /register/i }).click();
  await page.getByLabel(/full name/i).fill(who.name);
  await page.getByLabel(/^email/i).last().fill(who.email);
  await page.getByLabel(/contact number/i).fill("01712345678");
  await page.getByLabel(/department/i).selectOption("Computer Science and Engineering");
  await page.getByLabel(/home district/i).fill("Dhaka");
  await page.getByLabel(/current residence/i).fill("Ahsanullah Hall");
  await page.getByLabel(/^password/i).last().fill(who.password);
  const confirm = page.getByLabel(/confirm password/i);
  if (await confirm.count()) await confirm.fill(who.password);
  const consent = page.getByLabel(/privacy/i);
  if (await consent.count()) await consent.check();
  await page.getByRole("button", { name: /create account|register|sign up/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("sign up, post, see it, sign out", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Campus life");

  await signUp(page, first);

  // The session is an HttpOnly cookie, invisible to page scripts.
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "csb_session")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain("csb_session");
  expect(await page.evaluate(() => localStorage.getItem("authToken"))).toBeNull();

  await page.goto("/lost-found");
  await page.getByRole("button", { name: /report|post/i }).first().click();
  await page.getByLabel(/title|item name/i).first().fill(bottle);
  await page.getByLabel(/location/i).fill("Central library");
  await page.getByLabel(/description/i).fill("Left on the second floor");
  await page.getByLabel(/contact/i).fill("01712345678");
  await page.getByRole("button", { name: /^(post|submit|report)/i }).last().click();
  const posted = page.getByRole("listitem").filter({ hasText: bottle });
  await expect(posted).toBeVisible();
  await expect(posted.getByText(`Posted by ${first.name}`)).toBeVisible();
  await expect(posted.getByRole("button", { name: /delete/i })).toBeVisible();

  await page.goto("/complaints");
  await page.getByRole("button", { name: /new complaint|report the first/i }).first().click();
  await page.getByLabel(/title/i).first().fill(fan);
  await page.getByLabel(/description/i).fill("The ceiling fan has not worked for a week");
  await page.getByLabel(/post anonymously/i).check();
  await page.getByRole("button", { name: /^(post|submit)/i }).last().click();
  const complaint = page.getByRole("listitem").filter({ hasText: fan });
  await expect(complaint).toBeVisible();
  await expect(complaint.getByText(/Anonymous/)).toBeVisible();

  await page.goto("/students");
  await expect(page.getByRole("list", { name: "People" }).getByText(first.name)).toBeVisible();

  await page.getByRole("button", { name: /sign out|log out/i }).click();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/auth/);
});

test("another student cannot delete those posts", async ({ page }) => {
  await signUp(page, second);
  await page.goto("/lost-found");
  const row = page.getByRole("listitem").filter({ hasText: bottle });
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: /delete/i })).toHaveCount(0);
});
