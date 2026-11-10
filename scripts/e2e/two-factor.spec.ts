import { expect, test, type Page } from '@playwright/test';
import { generate } from 'otplib';

const EMAIL = process.env.E2E_2FA_EMAIL ?? 'e2e-2fa@platinum-showcase.test';
const PASSWORD = process.env.E2E_2FA_PASSWORD ?? 'PwTest12345!';
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9002';

// The whole flow mutates one account, so run the specs in order and share the
// secret + recovery codes through module scope (Playwright uses one worker).
test.describe.configure({ mode: 'serial' });

let secret = '';
let recoveryCodes: string[] = [];

async function submitPassword(page: Page) {
  await page.goto('/login');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.locator('form button[type=submit]').click();
}

async function currentCode() {
  return generate({ secret });
}

test('enables 2FA and shows one-time recovery codes', async ({ page }) => {
  await submitPassword(page);
  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });

  await page.goto('/settings#security');
  const security = page.locator('#security');
  await security
    .getByRole('button', { name: 'Set up two-factor authentication' })
    .click();
  await page.fill('#two-factor-password', PASSWORD);
  await security.getByRole('button', { name: 'Continue', exact: true }).click();

  const secretField = page.locator('#security code').first();
  await expect(secretField).toBeVisible({ timeout: 15_000 });
  secret = (await secretField.innerText()).trim();
  expect(secret.length).toBeGreaterThan(0);

  // Filling the six digits triggers the 300 ms auto-submit.
  await page.fill('#two-factor-setup-code', await currentCode());
  const recoveryCodeEls = page.locator('#security div.font-mono span');
  await expect(recoveryCodeEls.first()).toBeVisible({ timeout: 15_000 });
  recoveryCodes = (await recoveryCodeEls.allInnerTexts()).map((code) =>
    code.trim(),
  );
  expect(recoveryCodes).toHaveLength(10);

  await page.getByRole('button', { name: /I saved them/i }).click();
  await page.waitForURL(/\/login\?twofactor=enabled/, { timeout: 15_000 });
});

test('signs in with a current authenticator code', async ({ page }) => {
  await submitPassword(page);

  // Filling the six digits auto-submits after the debounce.
  await page.fill('#otp', await currentCode());
  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });
  await expect(
    page.locator('header button[aria-label^="Account menu"]'),
  ).toHaveCount(1);
});

test('signs in with a recovery code', async ({ page }) => {
  await submitPassword(page);
  await expect(page.locator('#otp')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /Use a recovery code/i }).click();
  const recoveryCode = recoveryCodes[0];
  if (!recoveryCode) throw new Error('No recovery code was captured');
  await page.fill('#otp', recoveryCode);
  await page.getByRole('button', { name: /Verify and sign in/i }).click();
  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });
  await expect(
    page.locator('header button[aria-label^="Account menu"]'),
  ).toHaveCount(1);
});

test('disables 2FA and signs out', async ({ page }) => {
  await submitPassword(page);
  await expect(page.locator('#otp')).toBeVisible({ timeout: 15_000 });
  await page.fill('#otp', await currentCode());
  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });

  await page.goto('/settings#security');
  const security = page.locator('#security');
  await security
    .getByRole('button', { name: 'Disable 2FA', exact: true })
    .click();
  await page.fill('#two-factor-password', PASSWORD);
  await page.fill('#two-factor-confirm-code', await currentCode());
  await page
    .getByRole('button', { name: /Disable 2FA and sign out/i })
    .click();
  await page.waitForURL(/\/login\?twofactor=disabled/, { timeout: 15_000 });

  // With 2FA off, signing in only asks for the password.
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(`${baseURL}/`, { timeout: 15_000 });
  await expect(page.locator('#otp')).toHaveCount(0);
});
