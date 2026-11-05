import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { normalizeEmail } from '@/lib/email/address';
import { isRecentPassword, rememberPassword } from '@/lib/password-history';
import { sendEmail } from '@/lib/email/send';
import {
  emailTokenUrl,
  hashEmailToken,
  issueEmailToken,
} from '@/lib/email/tokens';
import { passwordChangedEmail, passwordResetEmail } from '@/lib/email/templates';

export const PASSWORD_RESET_TTL_MINUTES = 60;

export type EmailTokenState = 'valid' | 'expired' | 'used' | 'invalid';

export interface ResetUser {
  userId: string;
  email: string;
  username: string | null;
}

/**
 * Issues one reset link for the address, replacing any previous one. Always
 * resolves the same way from the caller's perspective (anti-enumeration lives
 * in the action).
 */
export async function requestPasswordReset(
  rawEmail: string,
  now: Date = new Date(),
): Promise<{ sent: boolean }> {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true },
  });
  if (!user) return { sent: false };

  const issued = issueEmailToken('PASSWORD_RESET', now);
  await prisma.$transaction([
    prisma.emailToken.deleteMany({
      where: { userId: user.id, kind: 'PASSWORD_RESET' },
    }),
    prisma.emailToken.create({
      data: {
        userId: user.id,
        kind: 'PASSWORD_RESET',
        tokenHash: issued.tokenHash,
        expiresAt: issued.expiresAt,
      },
    }),
  ]);

  const template = passwordResetEmail({
    username: user.username,
    url: emailTokenUrl('PASSWORD_RESET', issued.token),
    expiresMinutes: PASSWORD_RESET_TTL_MINUTES,
  });

  const result = await sendEmail({
    kind: 'password-reset',
    to: user.email,
    ...template,
  });
  return { sent: result.ok };
}

export async function getPasswordResetState(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<EmailTokenState> {
  if (!token) return 'invalid';

  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: { kind: true, usedAt: true, expiresAt: true },
  });
  if (!row || row.kind !== 'PASSWORD_RESET') return 'invalid';
  if (row.usedAt) return 'used';
  if (row.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'valid';
}

export type ConsumeResetResult =
  | { ok: true; user: ResetUser }
  | { ok: false; reason: 'invalid' | 'reused' };

/** Single-use, race-safe: the conditional update claims the token first. */
export async function consumePasswordReset({
  token,
  password,
  now = new Date(),
}: {
  token: string;
  password: string;
  now?: Date;
}): Promise<ConsumeResetResult> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: {
      id: true,
      userId: true,
      kind: true,
      usedAt: true,
      expiresAt: true,
      user: { select: { email: true, username: true, passwordHash: true } },
    },
  });

  if (
    !row ||
    row.kind !== 'PASSWORD_RESET' ||
    row.usedAt ||
    row.expiresAt.getTime() <= now.getTime()
  ) {
    return { ok: false, reason: 'invalid' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    // Checked before claiming the token, so a rejected password does not burn
    // the 60-minute link the user just received.
    if (
      await isRecentPassword({
        db: tx,
        userId: row.userId,
        currentHash: row.user.passwordHash,
        password,
      })
    ) {
      return { ok: false as const, reason: 'reused' as const };
    }

    const claimed = await tx.emailToken.updateMany({
      where: {
        id: row.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claimed.count === 0) {
      return { ok: false as const, reason: 'invalid' as const };
    }

    if (row.user.passwordHash) {
      await rememberPassword({
        db: tx,
        userId: row.userId,
        passwordHash: row.user.passwordHash,
      });
    }

    await tx.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    });
    // Receiving the email proves ownership, so a reset also verifies it.
    await tx.user.updateMany({
      where: { id: row.userId, emailVerified: null },
      data: { emailVerified: now },
    });
    await tx.emailToken.deleteMany({
      where: {
        userId: row.userId,
        kind: 'PASSWORD_RESET',
        NOT: { id: row.id },
      },
    });

    return {
      ok: true as const,
      user: {
        userId: row.userId,
        email: row.user.email,
        username: row.user.username,
      },
    };
  });
}

export async function sendPasswordChangedNotice(
  user: ResetUser,
  changedAt: Date = new Date(),
): Promise<void> {
  const template = passwordChangedEmail({
    username: user.username,
    changedAt,
  });
  await sendEmail({
    kind: 'password-changed',
    to: user.email,
    ...template,
  });
}
