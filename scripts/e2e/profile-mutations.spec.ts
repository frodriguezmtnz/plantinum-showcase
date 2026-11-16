import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { STORAGE_STATE } from './storage-state';

const PROFILE = '/u/e2e-runner';

test.use({ storageState: STORAGE_STATE });

// Spawns `node tsx/cli scripts/e2e/seed.ts` directly: going through the pnpm
// shim fails on Windows because cmd.exe cannot run the quoted npm wrapper.
function reseedFixture() {
  execFileSync(process.execPath, [require.resolve('tsx/cli'), 'scripts/e2e/seed.ts'], {
    stdio: 'inherit',
  });
}

/**
 * Regression specs for the profile gallery instant-refresh behaviour: deleting
 * or editing a platinum must be reflected in the grid immediately (the server
 * props drive page one) instead of waiting for a full reload.
 *
 * The gallery specs mutate the fixture, so the seed is refreshed before and
 * after the file to keep the rest of the suite deterministic.
 */
test.describe('profile gallery mutations', () => {
  test.beforeAll(() => {
    reseedFixture();
  });

  test.afterAll(() => {
    reseedFixture();
  });

  test('deleting a platinum reflects instantly and drops stale extra pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(PROFILE);

    const cards = page.locator('.break-inside-avoid:visible');
    const counter = page.locator('p[aria-live]:visible');
    await expect(cards).toHaveCount(8);
    await expect(counter.filter({ hasText: /Showing 8 of 14/ })).toBeVisible();

    // Pull the extra pages so the "total changed" discard path is exercised.
    await page.getByRole('button', { name: 'Load more platinums' }).click();
    await expect(cards).toHaveCount(14);
    await expect(counter.filter({ hasText: /Showing 14 of 14/ })).toBeVisible();

    // Delete a plate that lives on the server-rendered first page.
    const plate08 = cards.filter({ has: page.getByRole('heading', { name: 'E2E Plate 08' }) });
    await plate08.getByRole('button', { name: 'Delete platinum' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('Platinum deleted', { exact: true })).toBeVisible();

    // Without a reload, the card disappears and the stale offset pages are
    // dropped (back to page one with the new total of 13).
    await expect(plate08).toHaveCount(0);
    await expect(cards).toHaveCount(8);
    await expect(counter.filter({ hasText: /Showing 8 of 13/ })).toBeVisible();
  });

  test('editing a platinum comment reflects instantly in the gallery', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto(PROFILE);

    const cards = page.locator('.break-inside-avoid:visible');
    await expect(cards).toHaveCount(8);

    const plate07 = cards.filter({ has: page.getByRole('heading', { name: 'E2E Plate 07' }) });
    await plate07.getByRole('button', { name: 'Edit platinum' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Platinum Title' }).fill('PR73 e2e title');
    await dialog.getByRole('textbox', { name: /your comment/i }).fill('PR73 e2e: comment edited live');
    await dialog.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByText('Platinum updated', { exact: true })).toBeVisible();

    // The card picks up the new comment without a reload. The custom title
    // replaces the card heading, so locate by the comment text itself.
    await expect(page.getByText('PR73 e2e: comment edited live').first()).toBeVisible();
  });
});
