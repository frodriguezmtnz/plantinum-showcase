import { describe, expect, it } from 'vitest';
import { resolvePinnedAuthBaseUrl } from '@/lib/auth-base-url';

describe('resolvePinnedAuthBaseUrl', () => {
  it('returns null in development (request host stays trusted)', () => {
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'development',
        NEXT_PUBLIC_SITE_URL: 'https://example.com',
      }),
    ).toBeNull();
    expect(resolvePinnedAuthBaseUrl({ NODE_ENV: 'test' })).toBeNull();
  });

  it('returns null during next build (route-config collection evaluates the module)', () => {
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
      }),
    ).toBeNull();
  });

  it('pins AUTH_URL when it is already configured', () => {
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        AUTH_URL: 'https://auth.example.com',
      }),
    ).toBe('https://auth.example.com');
  });

  it('falls back to NEXTAUTH_URL, then the site URL, then VERCEL_URL', () => {
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        NEXTAUTH_URL: 'https://legacy.example.com',
      }),
    ).toBe('https://legacy.example.com');
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'https://site.example.com/',
      }),
    ).toBe('https://site.example.com/');
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        VERCEL_URL: 'preview-abc.vercel.app',
      }),
    ).toBe('https://preview-abc.vercel.app');
  });

  it('ignores an empty AUTH_URL (Vercel exposes it as an empty string)', () => {
    expect(
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        AUTH_URL: '',
        NEXT_PUBLIC_SITE_URL: 'https://site.example.com',
      }),
    ).toBe('https://site.example.com');
  });

  it('fails fast when production has no URL to pin', () => {
    expect(() => resolvePinnedAuthBaseUrl({ NODE_ENV: 'production' })).toThrow(
      /AUTH_URL.*cannot be taken from request Host headers/,
    );
  });

  it('rejects a base URL that is not the site root', () => {
    expect(() =>
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'https://example.com/subpath',
      }),
    ).toThrow(/must be the site root/);
  });

  it('rejects a malformed base URL', () => {
    expect(() =>
      resolvePinnedAuthBaseUrl({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SITE_URL: 'not a url',
      }),
    ).toThrow(/not a valid URL/);
  });
});
