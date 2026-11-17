import type {NextConfig} from 'next';

// React/Turbopack rely on eval() for dev-only debugging features (stack
// reconstruction, HMR). Production never uses it, so keep the stricter policy
// there while letting `next dev` run without CSP console noise.
const isDev = process.env.NODE_ENV !== 'production';
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    // Vercel does not inject HSTS on custom domains; without it a first
    // visit (or a MITM) can be downgraded to http. One year with
    // includeSubDomains; skip preload until the domain posture is audited.
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      scriptSrc,
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join('; '),
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

    