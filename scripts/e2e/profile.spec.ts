import { expect, test } from '@playwright/test';

const PROFILE = '/u/e2e-runner';

test.describe('profile', () => {
  test('shows activity stats and the most voted plates', async ({ page }) => {
    const response = await page.goto(PROFILE);
    test.skip(response?.status() === 404, 'E2E profile is not seeded');
    // Let React finish streaming so a transient hidden copy of the page is gone.
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#main span').filter({ hasText: /^14 Platinums$/ }).first()).toBeVisible();
    await expect(page.locator('#main span').filter({ hasText: /^91 Total Votes$/ }).first()).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Platinum pace' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Most voted' })).toBeVisible();

    // Top plate by votes (13), followed by 12 and 11.
    await expect(page.getByRole('link', { name: 'E2E Plate 01', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'E2E Plate 03', exact: true })).toBeVisible();
    await expect(page.getByText('PS5 14').first()).toBeVisible();

    // The most voted plate is featured separately, not in the gallery.
    await expect(page.getByRole('heading', { name: 'Pride of the Collection' })).toBeVisible();
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
    // 14 plates minus the featured "Pride of the Collection" one.
    await expect(cards).toHaveCount(1);
    await expect(page.getByText('Page 2 of 2').first()).toBeVisible();

    await page.getByRole('link', { name: 'Previous' }).click();
    await page.waitForURL(/\?page=1$/);
    await expect(cards).toHaveCount(12);
  });
});
