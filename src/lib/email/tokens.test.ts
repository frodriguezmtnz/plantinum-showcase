import { describe, expect, it } from 'vitest';
import {
  EMAIL_TOKEN_PATH,
  EMAIL_TOKEN_TTL_MS,
  emailTokenUrl,
  hashEmailToken,
  issueEmailToken,
} from './tokens';

describe('email tokens', () => {
  it('hashes deterministically and never exposes the raw token', () => {
    const token = 'a'.repeat(43);
    expect(hashEmailToken(token)).toBe(hashEmailToken(token));
    expect(hashEmailToken(token)).toHaveLength(64);
    expect(hashEmailToken(token)).not.toBe(token);
  });

  it('issues distinct high-entropy tokens', () => {
    const first = issueEmailToken('PASSWORD_RESET');
    const second = issueEmailToken('PASSWORD_RESET');
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
    expect(first.token.length).toBeGreaterThanOrEqual(43);
  });

  it('uses the agreed TTLs', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const reset = issueEmailToken('PASSWORD_RESET', now);
    const verify = issueEmailToken('EMAIL_VERIFY', now);
    const change = issueEmailToken('EMAIL_CHANGE', now);

    expect(reset.expiresAt.getTime() - now.getTime()).toBe(
      EMAIL_TOKEN_TTL_MS.PASSWORD_RESET,
    );
    expect(verify.expiresAt.getTime() - now.getTime()).toBe(
      EMAIL_TOKEN_TTL_MS.EMAIL_VERIFY,
    );
    expect(change.expiresAt.getTime() - now.getTime()).toBe(
      EMAIL_TOKEN_TTL_MS.EMAIL_CHANGE,
    );
    expect(EMAIL_TOKEN_TTL_MS.PASSWORD_RESET).toBe(60 * 60 * 1000);
    expect(EMAIL_TOKEN_TTL_MS.EMAIL_VERIFY).toBe(24 * 60 * 60 * 1000);
    expect(EMAIL_TOKEN_TTL_MS.EMAIL_CHANGE).toBe(30 * 60 * 1000);
  });

  it('builds the right route per kind', () => {
    const resetUrl = emailTokenUrl('PASSWORD_RESET', 'abc+/=');
    const verifyUrl = emailTokenUrl('EMAIL_VERIFY', 'abc+/=');
    const changeUrl = emailTokenUrl('EMAIL_CHANGE', 'abc+/=');

    expect(resetUrl).toContain(`${EMAIL_TOKEN_PATH.PASSWORD_RESET}?token=`);
    expect(verifyUrl).toContain(`${EMAIL_TOKEN_PATH.EMAIL_VERIFY}?token=`);
    expect(changeUrl).toContain(`${EMAIL_TOKEN_PATH.EMAIL_CHANGE}?token=`);
    expect(resetUrl).toContain(encodeURIComponent('abc+/='));
  });
});
