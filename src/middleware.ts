import { NextRequest, NextResponse } from "next/server";

// Content-Security-Policy with a per-request nonce.
//
// In production the policy drops `'unsafe-inline'` for scripts: Next.js reads
// the nonce from the REQUEST's CSP header and applies it to every script it
// renders (bootstrap, chunks, inline flight data), while `'strict-dynamic'`
// lets those nonce'd scripts load their own dependencies. Any injected inline
// script (HTML injection, dependency bug) therefore no longer executes.
//
// Dev keeps the previous looser policy: Turbopack/React devtools rely on
// inline scripts and eval.
//
// The static CSP that used to live in next.config.ts is gone on purpose:
// two CSP headers would both be enforced by browsers, and the static one
// still carried 'unsafe-inline'.
const isDev = process.env.NODE_ENV !== "production";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "worker-src 'self' blob:",
    // Tailwind (and GSAP) inject inline styles; styles are not an XSS
    // execution vector the way scripts are, so 'unsafe-inline' stays.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    // Aligned with X-Frame-Options: DENY (next.config.ts): nothing may embed
    // this site, not even itself.
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  // Next.js propagates the nonce to the scripts it renders by reading the
  // CSP of the REQUEST; x-nonce is exposed for server components that need it.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: "/(.*)",
};
