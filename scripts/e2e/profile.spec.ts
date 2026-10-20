import { expect, test } from '@playwright/test';

const PROFILE = '/u/e2e-runner';

test.describe('profile', () => {
  test('shows activity stats and the top voted plates', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');
    // Let React finish streaming so a transient hidden copy of the page is gone.
    await page.waitForLoadState('networkidle');

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
    await expect(page.locator('[data-platform="PS5"]')).toContainText('14');
  });

  test('filters the pace between active months and the full year', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');
    await page.waitForLoadState('networkidle');

    // The fixture creates all plates in the current month.
    await expect(page.locator('[data-month]')).toHaveCount(1);

    await page.getByRole('link', { name: 'Last 12 months' }).click();
    await page.waitForURL(/\?pace=all$/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-month]')).toHaveCount(12);

    await page.getByRole('link', { name: 'Active months' }).click();
    await page.waitForURL(/\?pace=active$/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-month]')).toHaveCount(1);
  });

  test('paginates the trophy gallery', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.break-inside-avoid');
    await expect(cards).toHaveCount(12);
    await expect(page.getByText('Page 1 of 2').first()).toBeVisible();

    await page.getByRole('link', { name: 'Next' }).click();
    await page.waitForURL(/\?page=2$/);
    await expect(cards).toHaveCount(2);
    await expect(page.getByText('Page 2 of 2').first()).toBeVisible();

    await page.getByRole('link', { name: 'Previous' }).click();
    await page.waitForURL(/\/u\/e2e-runner$/);
    await expect(cards).toHaveCount(12);
  });
});
