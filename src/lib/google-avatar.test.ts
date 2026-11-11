import { describe, expect, it } from 'vitest';
import { googleAvatarHiResUrl, isGoogleAvatarUrl } from '@/lib/google-avatar';

describe('isGoogleAvatarUrl', () => {
  it('accepts https googleusercontent subdomains', () => {
    expect(isGoogleAvatarUrl('https://lh3.googleusercontent.com/a/abc=s96-c')).toBe(true);
    expect(isGoogleAvatarUrl('https://images.googleusercontent.com/a/abc')).toBe(true);
  });

  it('rejects other hosts, http, and empty values', () => {
    expect(isGoogleAvatarUrl('https://example.com/a.png')).toBe(false);
    expect(isGoogleAvatarUrl('https://googleusercontent.com.evil.test/a.png')).toBe(false);
    expect(isGoogleAvatarUrl('http://lh3.googleusercontent.com/a/abc')).toBe(false);
    expect(isGoogleAvatarUrl('')).toBe(false);
    expect(isGoogleAvatarUrl(null)).toBe(false);
    expect(isGoogleAvatarUrl(undefined)).toBe(false);
    expect(isGoogleAvatarUrl('not a url')).toBe(false);
  });
});

describe('googleAvatarHiResUrl', () => {
  it('bumps the default 96px rendition to 256px', () => {
    expect(
      googleAvatarHiResUrl('https://lh3.googleusercontent.com/a/abc=s96-c'),
    ).toBe('https://lh3.googleusercontent.com/a/abc=s256-c');
    expect(
      googleAvatarHiResUrl('https://lh3.googleusercontent.com/a/abc=s96'),
    ).toBe('https://lh3.googleusercontent.com/a/abc=s256-c');
  });

  it('leaves URLs without a size suffix untouched', () => {
    const url = 'https://lh3.googleusercontent.com/a/abc';
    expect(googleAvatarHiResUrl(url)).toBe(url);
  });

  it('never rewrites non-google hosts', () => {
    const url = 'https://example.com/avatar=s96-c';
    expect(googleAvatarHiResUrl(url)).toBe(url);
  });
});
