import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import {
  DISPOSABLE_EMAIL_ERROR,
  normalizeEmail,
  registrationEmailProblem,
} from '@/lib/email/address';
import { sendEmail } from '@/lib/email/send';
import {
  EMAIL_CHANGE_TTL_MINUTES,
  emailTokenUrl,
  hashEmailToken,
  issueEmailToken,
} from '@/lib/email/tokens';
import {
  emailChangeActiveEmail,
  emailChangeConfirmEmail,
  emailChangeRequestedEmail,
  emailChangedEmail,
} from '@/lib/email/templates';
import type { EmailTokenState } from '@/lib/email/password-reset';

export type RequestEmailChangeResult =
  | { ok: true; newEmail: string; expiresAt: Date }
  | {
      ok: false;
      reason:
        | 'invalid'
        | 'disposable'
        | 'same'
        | 'in-use'
        | 'password'
        | 'no-password'
        | 'send-failed';
    };

/**
 * Verifies the current password, validates the target and sends a 30-minute
 * confirmation link to the NEW address. The account keeps its current email
 * until the link is consumed. Previous change links are replaced.
 */
export async function requestEmailChange({
  userId,
  newEmail,
  currentPassword,
  now = new Date(),
}: {
  userId: string;
  newEmail: string;
  currentPassword: string;
  now?: Date;
}): Promise<RequestEmailChangeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, passwordHash: true },
  });
  if (!user?.passwordHash) return { ok: false, reason: 'no-password' };
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return { ok: false, reason: 'password' };
  }

  const email = normalizeEmail(newEmail);
  if (email === normalizeEmail(user.email)) {
    return { ok: false, reason: 'same' };
  }

  const problem = await registrationEmailProblem(email);
  if (problem) {
    return {
      ok: false,
      reason: problem === DISPOSABLE_EMAIL_ERROR ? 'disposable' : 'invalid',
    };
  }

  const taken = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (taken && taken.id !== userId) {
    return { ok: false, reason: 'in-use' };
  }

  const issued = issueEmailToken('EMAIL_CHANGE', now);
  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId, kind: 'EMAIL_CHANGE' } }),
    prisma.emailToken.create({
      data: {
        userId,
        kind: 'EMAIL_CHANGE',
        tokenHash: issued.tokenHash,
        pendingEmail: email,
        expiresAt: issued.expiresAt,
      },
    }),
  ]);

  const template = emailChangeConfirmEmail({
    username: user.username,
    url: emailTokenUrl('EMAIL_CHANGE', issued.token),
    expiresMinutes: EMAIL_CHANGE_TTL_MINUTES,
  });
  const sent = await sendEmail({
    kind: 'email-change-confirm',
    to: email,
    ...template,
  });
  if (!sent.ok) {
    // Do not leave a link nobody received.
    await prisma.emailToken.deleteMany({
      where: { userId, kind: 'EMAIL_CHANGE', tokenHash: issued.tokenHash },
    });
    return { ok: false, reason: 'send-failed' };
  }

  // Best effort: the current address learns about the attempt immediately.
  const notice = emailChangeRequestedEmail({
    username: user.username,
    newEmail: email,
    requestedAt: now,
  });
  await sendEmail({
    kind: 'email-change-requested',
    to: user.email,
    ...notice,
  });

  return { ok: true, newEmail: email, expiresAt: issued.expiresAt };
}

export async function getEmailChangeState(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<EmailTokenState> {
  if (!token) return 'invalid';

  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: { kind: true, usedAt: true, expiresAt: true },
  });
  if (!row || row.kind !== 'EMAIL_CHANGE') return 'invalid';
  if (row.usedAt) return 'used';
  if (row.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'valid';
}

export type ConsumeEmailChangeResult =
  | { ok: true; previousEmail: string; email: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'in-use' | 'same' };

/**
 * Single-use, race-safe: the conditional update claims the token before the
 * account is touched. On success every outstanding token for the user is
 * deleted, so links mailed to the old address cannot verify or reset the
 * account after the switch.
 */
export async function consumeEmailChange({
  token,
  now = new Date(),
}: {
  token: string;
  now?: Date;
}): Promise<ConsumeEmailChangeResult> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: {
      id: true,
      userId: true,
      kind: true,
      usedAt: true,
      expiresAt: true,
      pendingEmail: true,
      user: { select: { email: true, username: true } },
    },
  });

  if (!row || row.kind !== 'EMAIL_CHANGE' || !row.pendingEmail) {
    return { ok: false, reason: 'invalid' };
  }
  if (row.usedAt) return { ok: false, reason: 'used' };
  if (row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired' };
  }

  const nextEmail = normalizeEmail(row.pendingEmail);
  if (nextEmail === normalizeEmail(row.user.email)) {
    return { ok: false, reason: 'same' };
  }

  const result = await prisma
    .$transaction(async (tx) => {
      const taken = await tx.user.findUnique({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (taken && taken.id !== row.userId) {
        return { ok: false as const, reason: 'in-use' as const };
      }

      const claimed = await tx.emailToken.updateMany({
        where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count === 0) {
        return { ok: false as const, reason: 'used' as const };
      }

      await tx.user.update({
        where: { id: row.userId },
        data: {
          email: nextEmail,
          emailVerified: now,
          // Confirming the new address revokes every existing session.
          sessionVersion: { increment: 1 },
        },
      });
      // Verification/reset links mailed to the old address must die with it.
      // Keep the consumed row so a replay reports "used" instead of "invalid".
      await tx.emailToken.deleteMany({
        where: { userId: row.userId, NOT: { id: row.id } },
      });

      return {
        ok: true as const,
        previousEmail: row.user.email,
        email: nextEmail,
        username: row.user.username,
      };
    })
    .catch((error) => {
      if ((error as { code?: string }).code === 'P2002') {
        return { ok: false as const, reason: 'in-use' as const };
      }
      throw error;
    });

  if (!result.ok) return result;

  const previous = emailChangedEmail({
    username: result.username,
    newEmail: result.email,
    changedAt: now,
  });
  await sendEmail({
    kind: 'email-changed',
    to: result.previousEmail,
    ...previous,
  });

  const active = emailChangeActiveEmail({
    username: result.username,
    changedAt: now,
  });
  await sendEmail({
    kind: 'email-change-active',
    to: result.email,
    ...active,
  });

  return { ok: true, previousEmail: result.previousEmail, email: result.email };
}
