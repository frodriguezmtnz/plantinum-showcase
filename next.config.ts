import type {NextConfig} from 'next';

// React/Turbopack rely on eval() for dev-only debugging features (stack
// reconstruction, HMR). Production never uses it.
//
// The Content-Security-Policy is issued by src/middleware.ts (nonce-based in
// production) — do not add a static CSP here again: browsers enforce every
// CSP header they receive, and a static copy would still allow inline
// scripts.

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  // Keep the mailer out of the bundle: nodemailer loads optional transports and
  // is only used from server actions.
  serverExternalPackages: ['nodemailer'],
  // Next dev blocks HMR/fonts from a different host; quick cloudflared tunnels
  // rotate their hostname, so allow the whole family during development.
  allowedDevOrigins: ['*.trycloudflare.com'],
  experimental: {
    // Server Action bodies default to 1 MB, which a compressed screenshot can
    // easily exceed. The upload form caps the file at 4 MB client-side and the
    // action enforces the same cap server-side; 4.5 MB gives multipart
    // headroom without crossing Vercel's ~4.5 MB request-body limit.
    serverActions: {
      bodySizeLimit: '4500kb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

    