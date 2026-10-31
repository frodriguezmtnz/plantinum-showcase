import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, test as setup } from '@playwright/test';
import { STORAGE_STATE } from './storage-state';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9002';

setup('authenticate', async ({ page, context }) => {
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });

  if (!EMAIL || !PASSWORD) {
    // Keep the state file loadable; the authenticated describes skip
    // themselves when credentials are absent.
    await context.storageState({ path: STORAGE_STATE });
    setup.skip(true, 'Set E2E_EMAIL and E2E_PASSWORD to run authenticated specs');
    return;
  }

  await page.goto('/login');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(baseURL + '/');
  await expect(page.locator('header button[aria-label^="Account menu"]')).toHaveCount(1);

  await context.storageState({ path: STORAGE_STATE });
});
