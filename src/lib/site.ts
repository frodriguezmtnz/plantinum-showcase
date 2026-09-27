/**
 * Canonical site URL, used for metadata, Open Graph images and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL in production; on Vercel we fall back to the
 * deployment URL so previews still resolve absolute links.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    "http://localhost:9002";

  return raw.replace(/\/+$/, "");
}
