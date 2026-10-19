import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(EMAIL && PASSWORD);
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9002';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('#email', EMAIL!);
  await page.fill('#password', PASSWORD!);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(baseURL + '/');
}

test.describe('public pages', () => {
  test('home CTA copy is centred in its column', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { name: /Your platinum belongs on this row/i });
    await heading.scrollIntoViewIfNeeded();
    const diff = await heading.evaluate((el) => {
      const parent = el.parentElement!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(el);
      const text = range.getBoundingClientRect();
      return Math.round(text.x + text.width / 2 - (parent.x + parent.width / 2));
    });
    expect(Math.abs(diff)).toBeLessThan(6);
  });

  test('header idle links get a visible hover background in light mode', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('header nav a', { hasText: 'Explore' }).first();
    const before = await link.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(before).toBe('rgba(0, 0, 0, 0)');
    await link.hover();
    await expect
      .poll(() => link.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(before);
  });

  test('above-the-fold cards are preloaded, not lazy', async ({ page }) => {
    await page.goto('/');
    const firstImage = page.locator('#latest img').first();
    test.skip((await firstImage.count()) === 0, 'No gallery plates in this dataset');
    const preloads = await page.locator('link[rel="preload"][as="image"]').count();
    expect(preloads).toBeGreaterThanOrEqual(1);
    expect(await firstImage.getAttribute('loading')).not.toBe('lazy');
  });

  test('footer is a compact centred row with an animated hover', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();

    const layout = await footer.evaluate((el) => {
      const links = [...el.querySelectorAll<HTMLElement>('.footer-link')];
      const rows = new Set(links.map((a) => Math.round(a.getBoundingClientRect().top)));
      const first = links[0]!.getBoundingClientRect();
      const last = links[links.length - 1]!.getBoundingClientRect();
      return {
        rows: rows.size,
        centered: Math.abs((first.left + last.right) / 2 - window.innerWidth / 2) < 12,
        labels: el.querySelectorAll('.field-mark').length,
      };
    });
    expect(layout).toEqual({ rows: 1, centered: true, labels: 0 });

    const link = footer.locator('.footer-link').first();
    const colorBefore = await link.evaluate((el) => getComputedStyle(el).color);
    const underlineBefore = await link.evaluate((el) => getComputedStyle(el, '::after').transform);
    await link.hover();
    await expect.poll(() => link.evaluate((el) => getComputedStyle(el).color)).not.toBe(colorBefore);
    expect(await link.evaluate((el) => getComputedStyle(el, '::after').transform)).not.toBe(underlineBefore);
  });

  test('login page has no dead forgot-password link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form button[type=submit]')).toBeVisible();
    await expect(page.getByText(/forgot your password/i)).toHaveCount(0);
  });

  test('spoiler cards hide the image until revealed', async ({ page }) => {
    await page.goto('/explore');
    const spoilers = page.locator('.platinum-card-spoiler');
    // The gallery can take a beat on a cold Turbopack compile.
    await expect(spoilers.first()).toBeVisible({ timeout: 20_000 });
    const count = await spoilers.count();
    test.skip(count === 0, 'No spoiler plates in this dataset');

    const handle = await spoilers.first().elementHandle();
    expect(handle).not.toBeNull();

    const hidden = await handle!.evaluate((el) => {
      const img = el.querySelector('img')!;
      return { src: img.getAttribute('src') ?? '', filter: getComputedStyle(img).filter };
    });
    if (hidden.src.includes('/api/images/')) {
      expect(hidden.src).toContain('fx=pixel');
    } else {
      expect(hidden.filter).toContain('blur');
    }

    const reveal = await handle!.$('button:has-text("Reveal screenshot")');
    expect(reveal).not.toBeNull();
    await reveal!.click();

    await expect
      .poll(() => handle!.evaluate((el) => el.className))
      .not.toContain('platinum-card-spoiler');

    const shown = await handle!.evaluate((el) => ({
      overlay: el.querySelectorAll('.spoiler-frost-strong').length,
      filter: getComputedStyle(el.querySelector('img')!).filter,
    }));
    expect(shown.overlay).toBe(0);
    expect(shown.filter).not.toContain('blur');
  });
});

test.describe('authenticated', () => {
  test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run these specs');

  test('sign-in does not loop on session refreshes', async ({ page }) => {
    let sessionRequests = 0;
    let rscRequests = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/session')) sessionRequests += 1;
      if (req.url().includes('_rsc=')) rscRequests += 1;
    });

    await login(page);
    // Let the router's link prefetches finish, then watch for the loop: an
    // endless session refresh keeps firing requests forever, a healthy page
    // settles.
    await page.waitForTimeout(4000);
    const sessionsAfterSettle = sessionRequests;
    const rscAfterSettle = rscRequests;
    await page.waitForTimeout(3000);

    expect(sessionRequests - sessionsAfterSettle).toBeLessThan(3);
    expect(rscRequests - rscAfterSettle).toBeLessThan(3);
    await expect(page.locator('header button[aria-label^="Account menu"]')).toHaveCount(1);
  });

  test('date picker shows one month/year label and arrows above the grid', async ({ page }) => {
    await login(page);
    await page.goto('/upload');
    await page.locator('button:has-text("Pick a date")').first().click();

    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    const labels = await dialog.locator('select + span[aria-hidden="true"]').allInnerTexts();
    expect(labels).toHaveLength(2);

    const next = dialog.locator('button[aria-label*="Next" i]').first();
    const nextBox = await next.boundingBox();
    const gridBox = await dialog.locator('table').first().boundingBox();
    expect(nextBox).not.toBeNull();
    expect(gridBox).not.toBeNull();
    expect(nextBox!.y + nextBox!.height).toBeLessThanOrEqual(gridBox!.y + 2);

    let overlaps = 0;
    for (const cell of await dialog.locator('table button[data-day]').all()) {
      const b = await cell.boundingBox();
      if (
        b &&
        b.x < nextBox!.x + nextBox!.width &&
        b.x + b.width > nextBox!.x &&
        b.y < nextBox!.y + nextBox!.height &&
        b.y + b.height > nextBox!.y
      ) {
        overlaps += 1;
      }
    }
    expect(overlaps).toBe(0);

    const before = labels[0];
    await next.click();
    await expect
      .poll(async () => (await dialog.locator('select + span[aria-hidden="true"]').allInnerTexts())[0])
      .not.toBe(before);
  });

  test('notification bell refetches when the tab becomes visible', async ({ page }) => {
    await login(page);
    await page.waitForTimeout(800);

    let posts = 0;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().startsWith(baseURL)) posts += 1;
    });
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await expect.poll(() => posts, { timeout: 5000 }).toBeGreaterThan(0);
  });
});
