import { createHash, randomBytes } from 'node:crypto';
import { getSiteUrl } from '@/lib/site';
import type { EmailTokenKind } from '@/generated/prisma/enums';

/** Short enough to limit a leaked link, long enough for mail filters. */
export const EMAIL_CHANGE_TTL_MINUTES = 30;

export const EMAIL_TOKEN_TTL_MS: Record<EmailTokenKind, number> = {
  PASSWORD_RESET: 60 * 60 * 1000,
  EMAIL_VERIFY: 24 * 60 * 60 * 1000,
  EMAIL_CHANGE: EMAIL_CHANGE_TTL_MINUTES * 60 * 1000,
};

export const EMAIL_TOKEN_PATH: Record<EmailTokenKind, string> = {
  PASSWORD_RESET: '/reset-password',
  EMAIL_VERIFY: '/verify-email',
  EMAIL_CHANGE: '/confirm-email-change',
};

/** Only the hash is stored; the raw token exists just in the email link. */
export function hashEmailToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedEmailToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

export function issueEmailToken(
  kind: EmailTokenKind,
  now: Date = new Date(),
): IssuedEmailToken {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: hashEmailToken(token),
    expiresAt: new Date(now.getTime() + EMAIL_TOKEN_TTL_MS[kind]),
  };
}

export function emailTokenUrl(kind: EmailTokenKind, token: string): string {
  return `${getSiteUrl()}${EMAIL_TOKEN_PATH[kind]}?token=${encodeURIComponent(token)}`;
}
