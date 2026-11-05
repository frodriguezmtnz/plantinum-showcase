import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send';
import {
  emailTokenUrl,
  hashEmailToken,
  issueEmailToken,
} from '@/lib/email/tokens';
import { verifyEmailEmail } from '@/lib/email/templates';
import type { EmailTokenState } from '@/lib/email/password-reset';

export const EMAIL_VERIFY_TTL_HOURS = 24;

/** `verified` means the account is already confirmed, whatever the token state. */
export type EmailVerificationState = EmailTokenState | 'verified';

export type VerificationRequestResult =
  | { sent: true }
  | { sent: false; reason: 'verified' | 'missing' | 'send-failed' };

/** Replaces any pending verification link for the user. */
export async function requestEmailVerification(
  userId: string,
  now: Date = new Date(),
): Promise<VerificationRequestResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, emailVerified: true },
  });
  if (!user) return { sent: false, reason: 'missing' };
  if (user.emailVerified) return { sent: false, reason: 'verified' };

  const issued = issueEmailToken('EMAIL_VERIFY', now);
  await prisma.$transaction([
    prisma.emailToken.deleteMany({
      where: { userId, kind: 'EMAIL_VERIFY' },
    }),
    prisma.emailToken.create({
      data: {
        userId,
        kind: 'EMAIL_VERIFY',
        tokenHash: issued.tokenHash,
        expiresAt: issued.expiresAt,
      },
    }),
  ]);

  const template = verifyEmailEmail({
    username: user.username,
    url: emailTokenUrl('EMAIL_VERIFY', issued.token),
    expiresHours: EMAIL_VERIFY_TTL_HOURS,
  });

  const result = await sendEmail({
    kind: 'email-verify',
    to: user.email,
    ...template,
  });
  return result.ok ? { sent: true } : { sent: false, reason: 'send-failed' };
}

export async function getEmailVerificationState(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<EmailVerificationState> {
  if (!token) return 'invalid';

  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: {
      kind: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { emailVerified: true } },
    },
  });
  if (!row || row.kind !== 'EMAIL_VERIFY') return 'invalid';
  // An old link for a confirmed account says so instead of pretending to
  // verify it again (or celebrating a second time).
  if (row.user.emailVerified) return 'verified';
  if (row.usedAt) return 'used';
  if (row.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'valid';
}

export type ConsumeVerificationResult =
  | { ok: true; userId: string; alreadyVerified: boolean }
  | { ok: false; reason: 'invalid' };

/**
 * POST-only consumption (the page shows a button): email scanners that prefetch
 * links cannot burn the token before the user clicks.
 */
export async function consumeEmailVerification({
  token,
  now = new Date(),
}: {
  token: string;
  now?: Date;
}): Promise<ConsumeVerificationResult> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: {
      id: true,
      userId: true,
      kind: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { emailVerified: true } },
    },
  });

  if (!row || row.kind !== 'EMAIL_VERIFY') {
    return { ok: false, reason: 'invalid' };
  }

  return prisma.$transaction(async (tx) => {
    const alreadyVerified = Boolean(row.user.emailVerified);

    if (!alreadyVerified) {
      if (row.usedAt || row.expiresAt.getTime() <= now.getTime()) {
        return { ok: false as const, reason: 'invalid' as const };
      }

      const claimed = await tx.emailToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count === 0) {
        return { ok: false as const, reason: 'invalid' as const };
      }

      await tx.user.update({
        where: { id: row.userId },
        data: { emailVerified: now },
      });
    }

    await tx.emailToken.deleteMany({
      where: { userId: row.userId, kind: 'EMAIL_VERIFY', NOT: { id: row.id } },
    });

    return { ok: true as const, userId: row.userId, alreadyVerified };
  });
}
