import { defineConfig, devices } from '@playwright/test';

const PORT = 9002;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './scripts/e2e',
  timeout: 60_000,
  // The auth specs share a dev server and sign in/out, so keep it sequential.
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    // Edge is already installed on Windows and needs no browser download.
    // Set PW_CHANNEL=chromium on machines/CI that only have Playwright's browser.
    channel: process.env.PW_CHANNEL || 'msedge',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // CI builds first and serves the production bundle; local runs use dev.
    command: process.env.E2E_SERVER_COMMAND ?? 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
