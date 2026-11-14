import { afterEach, describe, expect, it } from 'vitest';
import {
  googleAvatarHiResUrl,
  importGoogleAvatar,
  isGoogleAvatarUrl,
} from '@/lib/google-avatar';

const STORAGE_ENV_KEYS = [
  'B2_KEY_ID',
  'B2_APP_KEY',
  'B2_BUCKET',
  'B2_ENDPOINT',
  'B2_REGION',
] as const;

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

describe('importGoogleAvatar', () => {
  const original = Object.fromEntries(
    STORAGE_ENV_KEYS.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    for (const key of STORAGE_ENV_KEYS) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  });

  function configureStorage() {
    process.env.B2_KEY_ID = 'key';
    process.env.B2_APP_KEY = 'secret';
    process.env.B2_BUCKET = 'bucket';
    process.env.B2_ENDPOINT = 'https://s3.eu-central-003.backblazeb2.com';
    process.env.B2_REGION = 'eu-central-003';
  }

  it('returns null without touching storage when B2 is not configured', async () => {
    for (const key of STORAGE_ENV_KEYS) delete process.env[key];
    await expect(
      importGoogleAvatar({
        userId: 'user-1',
        url: 'https://lh3.googleusercontent.com/a/abc=s96-c',
      }),
    ).resolves.toBeNull();
  });

  it('refuses to fetch non-google hosts even when storage exists', async () => {
    configureStorage();
    await expect(
      importGoogleAvatar({
        userId: 'user-1',
        url: 'https://example.com/avatar.png',
      }),
    ).resolves.toBeNull();
  });
});
