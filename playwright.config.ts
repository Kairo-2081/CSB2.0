import { defineConfig } from "@playwright/test";

// Smoke test against a running build: `npm run build`, start the server with a
// throwaway DATABASE_URL, then `E2E_BASE_URL=http://localhost:3001 npm run test:e2e`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3001",
    trace: "retain-on-failure",
    launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
  },
});
