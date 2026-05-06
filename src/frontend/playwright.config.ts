import { defineConfig, devices } from "@playwright/test";

// Cross-browser smoke coverage for the Deep Research stream.
// chromium covers Chrome/Edge on Windows + Chrome on macOS.
// webkit covers Safari on macOS — required because fetch-event-source has
// historically had streaming/parsing quirks on Safari that we must regression-guard.
//
// To run locally:
//   pnpm exec playwright install chromium webkit
//   pnpm test:e2e
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
