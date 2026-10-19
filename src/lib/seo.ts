import { getSiteUrl } from '@/lib/site';

/**
 * Absolute canonical URL for a route. Canonicals never include query strings,
 * so filtered views (e.g. /explore?q=…) point at the clean page.
 */
export function canonicalUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === '/') return `${base}/`;

  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`.replace(/\/+$/, '');
}

/** Schema.org image/profile URLs must be absolute. */
export function absoluteAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${getSiteUrl()}${url.startsWith('/') ? url : `/${url}`}`;
}
