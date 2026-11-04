import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDisposableEmail } from './domains';
import {
  DISPOSABLE_EMAIL_ERROR,
  EMAIL_FORMAT_ERROR,
  emailFormatProblem,
  registrationEmailProblem,
} from './address';

afterEach(() => {
  delete process.env.EMAIL_DOMAIN_ALLOWLIST;
  vi.resetModules();
});

describe('disposable domain matcher', () => {
  it('flags known disposable domains', async () => {
    expect(await isDisposableEmail('someone@mailinator.com')).toBe(true);
    expect(await isDisposableEmail('someone@10minutemail.com')).toBe(true);
  });

  it('flags curated domains missing from the upstream snapshot', async () => {
    expect(await isDisposableEmail('someone@javafs.com')).toBe(true);
    expect(await isDisposableEmail('someone@inbox.javafs.com')).toBe(true);
  });

  it('flags subdomains by walking the parent suffixes', async () => {
    expect(await isDisposableEmail('someone@inbox.mailinator.com')).toBe(true);
    expect(await isDisposableEmail('someone@a.b.mailinator.com')).toBe(true);
  });

  it('leaves normal providers alone', async () => {
    for (const email of [
      'someone@gmail.com',
      'someone@outlook.com',
      'hunter@example.com',
      'someone@protonmail.com',
    ]) {
      expect(await isDisposableEmail(email)).toBe(false);
    }
  });

  it('normalizes case and trailing dots', async () => {
    expect(await isDisposableEmail('SOMEONE@MAILINATOR.COM.')).toBe(true);
  });

  it('honours EMAIL_DOMAIN_ALLOWLIST', async () => {
    vi.resetModules();
    process.env.EMAIL_DOMAIN_ALLOWLIST = '@mailinator.com, example.org';
    const fresh = await import('./domains');

    expect(await fresh.isDisposableEmail('someone@mailinator.com')).toBe(false);
    expect(fresh.isDisposableDomain('inbox.mailinator.com')).toBe(false);
    expect(await fresh.isDisposableEmail('someone@10minutemail.com')).toBe(true);
  });
});

describe('email address validation', () => {
  it('accepts a regular address', () => {
    expect(emailFormatProblem('hunter@example.com')).toBeNull();
    expect(emailFormatProblem('first.last+trophies@sub.example.co.uk')).toBeNull();
  });

  it('rejects malformed addresses and bogus domains', () => {
    expect(emailFormatProblem('')).toBe(EMAIL_FORMAT_ERROR);
    expect(emailFormatProblem('not-an-email')).toBe(EMAIL_FORMAT_ERROR);
    expect(emailFormatProblem('a@b..com')).toBe(EMAIL_FORMAT_ERROR);
    expect(emailFormatProblem('a@-bad.com')).toBe(EMAIL_FORMAT_ERROR);
    expect(emailFormatProblem(`${'a'.repeat(250)}@example.com`)).toBe(
      EMAIL_FORMAT_ERROR,
    );
  });

  it('adds the disposable-specific message only at registration', async () => {
    expect(await registrationEmailProblem('a@mailinator.com')).toBe(
      DISPOSABLE_EMAIL_ERROR,
    );
    expect(await registrationEmailProblem('hunter@example.com')).toBeNull();
  });
});
