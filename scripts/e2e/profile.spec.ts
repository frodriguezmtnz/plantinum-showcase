import { expect, test } from '@playwright/test';

const PROFILE = '/u/e2e-runner';

test.describe('profile', () => {
  test('shows activity stats and the top voted plates', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');

    await expect(page.locator('#main span').filter({ hasText: /^14 Platinums$/ }).first()).toBeVisible();
    await expect(page.locator('#main span').filter({ hasText: /^91 Total Votes$/ }).first()).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Platinum pace' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Top voted' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Platforms' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pride of the Collection' })).toHaveCount(0);

    // Top five plates by votes: 13, 12, 11, 10 and 9.
    await expect(page.getByRole('link', { name: 'E2E Plate 01', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'E2E Plate 03', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'E2E Plate 05', exact: true })).toBeVisible();
    await expect(page.locator('[data-platform="PS5"]')).toContainText('13');
    await expect(page.locator('[data-platform="PS4"]')).toContainText('1');
  });

  test('filters the pace between active months and the full year', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');

    // The fixture creates all plates in the current month.
    await expect(page.locator('[data-month]')).toHaveCount(1);

    await page.locator('a:visible', { hasText: 'Last 12 months' }).first().click();
    await page.waitForURL(/[?&]pace=all(?:&|$)/, { waitUntil: 'commit' });
    await expect(page.locator('[data-month]')).toHaveCount(12);

    await page.locator('a:visible', { hasText: 'Active months' }).first().click();
    await page.waitForURL(/[?&]pace=active(?:&|$)/, { waitUntil: 'commit' });
    await expect(page.locator('[data-month]')).toHaveCount(1);
  });

  test('loads 8 plates by default and loads more on demand', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(PROFILE);

    const cards = page.locator('.break-inside-avoid');
    const infiniteSwitch = page.getByRole('switch', { name: 'Infinite scroll' });
    await expect(cards).toHaveCount(8);
    await expect(page.getByText(/Showing 8 of 14/)).toBeVisible();
    await expect(infiniteSwitch).not.toBeChecked();

    // Infinite scroll is off by default: reaching the bottom must not fetch.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await expect(cards).toHaveCount(8);

    await page.getByRole('button', { name: 'Load more platinums' }).click();
    await expect(cards).toHaveCount(14);
    await expect(page.getByText(/Showing 14 of 14/)).toBeVisible();

    // Button should disappear when hasMore is false.
    await expect(page.getByRole('button', { name: 'Load more platinums' })).not.toBeVisible();
  });

  test('enables infinite scroll from the switch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(PROFILE);

    const cards = page.locator('.break-inside-avoid');
    const infiniteSwitch = page.getByRole('switch', { name: 'Infinite scroll' });
    await expect(cards).toHaveCount(8);
    await infiniteSwitch.click();
    await page.waitForURL(/infinite=on/, { waitUntil: 'commit' });
    await expect(infiniteSwitch).toBeChecked();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(cards).toHaveCount(14, { timeout: 10_000 });
  });

  test('sorts the gallery by name', async ({ page }) => {
    await page.goto(`${PROFILE}?sort=name-asc`);

    await expect(page.locator('[data-gallery-view="grid"]')).toBeVisible();
    const firstCard = page.locator('.break-inside-avoid').first();
    await expect(firstCard.getByRole('heading', { name: 'E2E Plate 01' })).toBeVisible();
  });

  test('switches between grid and list views', async ({ page }) => {
    await page.goto(PROFILE);

    await expect(page.locator('[data-gallery-view="grid"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'List' }).click();
    await page.waitForURL(/view=list/, { waitUntil: 'commit' });
    await expect(page.locator('[data-gallery-view="list"]')).toBeVisible();
    await expect(page.locator('[data-layout="list"]')).toHaveCount(8);

    await page.getByRole('button', { name: 'Grid' }).click();
    await page.waitForURL(/\/u\/e2e-runner$/, { waitUntil: 'commit' });
    await expect(page.locator('[data-gallery-view="grid"]')).toBeVisible();
  });

  test('filters by platform via URL and shows correct cards', async ({ page }) => {
    await page.goto(`${PROFILE}?platform=PS4`);

    const cards = page.locator('.break-inside-avoid');
    await expect(cards).toHaveCount(1);
    await expect(page.getByText(/Showing 1 of 1/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E2E Spoiler Plate' })).toBeVisible();
  });
});
