import { expect, test, type Page } from '@playwright/test';
import { STORAGE_STATE } from './storage-state';

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:9002';
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const hasCredentials = Boolean(EMAIL && PASSWORD);

async function structuredData(page: Page): Promise<Record<string, unknown>[]> {
  return page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
    nodes.flatMap((node) => {
      try {
        const parsed = JSON.parse(node.textContent ?? '{}') as Record<string, unknown>;
        const graph = parsed['@graph'];
        return Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [parsed];
      } catch {
        return [];
      }
    }),
  );
}

test.describe('seo', () => {
  test('home exposes a canonical URL and WebSite data', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(new URL(canonical!).href).toBe(`${baseURL}/`);

    const data = await structuredData(page);
    const website = data.find((item) => item['@type'] === 'WebSite');
    expect(website).toBeTruthy();
    expect(website!['url']).toBe(baseURL);
  });

  test('public static pages declare their canonical URL', async ({ page }) => {
    for (const path of ['/explore', '/pricing', '/hall-of-fame', '/about', '/faq', '/terms', '/privacy']) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}${path}`);
    }
  });

  test('filtered explore still points at the clean canonical', async ({ page }) => {
    await page.goto('/explore?q=final&platform=PS5&sort=votes');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}/explore`);
  });

  test('platinum detail exposes VideoGame and breadcrumb data', async ({ page }) => {
    await page.goto('/explore');
    const link = page.locator('a[href^="/platinum/"]').first();
    test.skip((await link.count()) === 0, 'No platinums in this dataset');

    const href = (await link.getAttribute('href'))!;
    await page.goto(href);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${baseURL}${href}`);

    const data = await structuredData(page);
    const game = data.find((item) => item['@type'] === 'VideoGame');
    expect(game).toBeTruthy();
    expect(typeof game!['name']).toBe('string');

    const breadcrumbs = data.find((item) => item['@type'] === 'BreadcrumbList');
    expect(breadcrumbs).toBeTruthy();
  });

  test('profile exposes ProfilePage data', async ({ page }) => {
    const response = await page.goto('/u/e2e-runner');
    test.skip(response?.status() === 404, 'E2E profile is not seeded');

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${baseURL}/u/e2e-runner`,
    );

    const data = await structuredData(page);
    const profile = data.find((item) => item['@type'] === 'ProfilePage');
    expect(profile).toBeTruthy();
    const person = profile!['mainEntity'] as Record<string, unknown>;
    expect(person['name']).toBe('e2e-runner');

    const sitemap = await page.request.get(`${baseURL}/sitemap.xml`);
    expect(await sitemap.text()).toContain(`${baseURL}/u/e2e-runner`);
  });

  test.describe('private pages', () => {
    test.use({ storageState: STORAGE_STATE });

    test('stay out of search results', async ({ page }) => {
      test.skip(!hasCredentials, 'Set E2E_EMAIL and E2E_PASSWORD to run this spec');

      for (const path of ['/upload', '/notifications']) {
        await page.goto(path);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
      }
    });
  });

  test('sitemap lists the static routes', async ({ request }) => {
    const response = await request.get(`${baseURL}/sitemap.xml`);
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain(`${baseURL}/explore`);
    expect(body).toContain(`${baseURL}/pricing`);
  });
});
