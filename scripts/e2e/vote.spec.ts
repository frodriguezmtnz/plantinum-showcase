import { expect, test, type Locator, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(EMAIL && PASSWORD);
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9002';
const TARGET = 'E2E Vote Target';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('#email', EMAIL!);
  await page.fill('#password', PASSWORD!);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(baseURL + '/');
}

function cardFor(page: Page, name: string): Locator {
  return page.locator('[class*="panel-solid"]', { hasText: name }).first();
}

function voteCount(label: string | null): number {
  return Number(label?.match(/\((\d+)\)$/)?.[1] ?? Number.NaN);
}

/** The fixture account may own no plate, so the vote must not be pending. */
async function ensureUnvoted(button: Locator) {
  if ((await button.getAttribute('aria-pressed')) === 'true') {
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  }
}

async function expectCount(button: Locator, value: number) {
  await expect
    .poll(async () => voteCount(await button.getAttribute('aria-label')))
    .toBe(value);
}

test.describe('vote heart', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run these specs');

  test('a like fires one alert-red burst, never on retract, and never under reduced motion', async ({
    page,
  }) => {
    await login(page);
    await page.goto('/explore');

    const card = cardFor(page, TARGET);
    test.skip((await card.count()) === 0, 'Seed the E2E vote target first (scripts/e2e/seed.ts)');

    const button = card.locator('button[aria-pressed]').first();
    await button.scrollIntoViewIfNeeded();
    await ensureUnvoted(button);

    const before = voteCount(await button.getAttribute('aria-label'));
    await button.click();

    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expectCount(button, before + 1);

    // One decorative burst, and the sparks wear the reserved alert-red rather
    // than a washed-out grey.
    const burst = button.locator('.vote-heart-burst');
    await expect(burst).toHaveCount(1);
    await expect(burst).toHaveAttribute('aria-hidden', 'true');
    await expect
      .poll(() =>
        button
          .locator('.vote-heart-spark')
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      )
      .toBe('rgb(230, 15, 0)');

    // A retract must not replay the animation: the burst node keeps its
    // marker, so the keyed wrapper was not remounted.
    await burst.evaluate((el) => el.setAttribute('data-burst-marker', 'kept'));
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expectCount(button, before);
    await expect(burst).toHaveAttribute('data-burst-marker', 'kept');

    // Reduced motion keeps the color/count change and skips the burst: no new
    // node is mounted (the marker survives) and the old one stays hidden.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expectCount(button, before + 1);
    await expect(burst).toHaveAttribute('data-burst-marker', 'kept');
    await expect(burst).toBeHidden();

    // Leave the fixture unvoted for the next run.
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expectCount(button, before);
  });
});
