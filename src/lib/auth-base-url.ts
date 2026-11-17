/**
 * Pins the Auth.js base URL in production.
 *
 * @auth/core always refuses a request when `trustHost` is false, so the app
 * keeps `trustHost: true` (the acknowledgement that the edge proxy — Vercel,
 * or localhost in dev — sets the Host header safely). The host-header
 * *injection* risk is neutralised separately: parseUrl() gives the
 * environment AUTH_URL absolute precedence over the request's
 * host/x-forwarded-host, so pinning it in production keeps a spoofed header
 * away from OAuth callbacks, redirects and cookie attributes.
 *
 * Vercel can expose AUTH_URL as an empty string — empty is not nullish, which
 * silently defeats that precedence — so the resolved URL is always written
 * back to process.env.AUTH_URL by the caller.
 */

export type AuthBaseUrlEnv = Record<string, string | undefined>;

/**
 * Resolves the URL to pin from the environment chain (AUTH_URL, then the
 * legacy NEXTAUTH_URL, then the site URL the deployment already requires for
 * email links, then the Vercel deployment URL for previews).
 *
 * - Returns null in development: the request host is trusted there.
 * - Returns null during `next build` (NEXT_PHASE=phase-production-build):
 *   the module is evaluated while collecting route config, but no request is
 *   served, so the pin only matters at runtime.
 * - Throws in production when there is no URL to pin, or when the candidate is
 *   not a valid site-root URL — a base URL with a path would also move the
 *   Auth.js basePath, which must not happen implicitly.
 */
export function resolvePinnedAuthBaseUrl(
  env: AuthBaseUrlEnv = process.env,
): string | null {
  const isProduction = env.NODE_ENV === "production";

  const candidate =
    env.AUTH_URL?.trim() ||
    env.NEXTAUTH_URL?.trim() ||
    env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "");

  if (!isProduction) return null;
  if (env.NEXT_PHASE === "phase-production-build") return null;

  if (!candidate) {
    throw new Error(
      "Production requires AUTH_URL, NEXTAUTH_URL, NEXT_PUBLIC_SITE_URL or VERCEL_URL so the Auth.js base URL cannot be taken from request Host headers.",
    );
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(
      `The configured Auth.js base URL is not a valid URL: ${candidate}`,
    );
  }

  if (url.pathname !== "/") {
    throw new Error(
      `The configured Auth.js base URL must be the site root, got path "${url.pathname}": ${candidate}`,
    );
  }

  return candidate;
}
