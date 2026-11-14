import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/send';
import {
  ACCOUNT_DELETE_TTL_MINUTES,
  emailTokenUrl,
  hashEmailToken,
  issueEmailToken,
} from '@/lib/email/tokens';
import {
  accountDeleteConfirmEmail,
  accountDeletedEmail,
} from '@/lib/email/templates';
import { deleteAccountData } from '@/lib/account-deletion';
import type { EmailTokenState } from '@/lib/email/password-reset';

export type RequestAccountDeleteResult =
  | { ok: true; email: string; expiresAt: Date }
  | {
      ok: false;
      reason: 'not-found' | 'has-password' | 'unverified' | 'send-failed';
    };

/**
 * Step-up for accounts that have no password (Google sign-ups): emails a
 * single-use link that opens the danger page. Password accounts keep the
 * in-app password confirmation and are rejected here.
 */
export async function requestAccountDelete({
  userId,
  now = new Date(),
}: {
  userId: string;
  now?: Date;
}): Promise<RequestAccountDeleteResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
      emailVerified: true,
      passwordHash: true,
    },
  });
  if (!user) return { ok: false, reason: 'not-found' };
  if (user.passwordHash) return { ok: false, reason: 'has-password' };
  if (!user.emailVerified) return { ok: false, reason: 'unverified' };

  const issued = issueEmailToken('ACCOUNT_DELETE', now);
  await prisma.$transaction([
    prisma.emailToken.deleteMany({ where: { userId, kind: 'ACCOUNT_DELETE' } }),
    prisma.emailToken.create({
      data: {
        userId,
        kind: 'ACCOUNT_DELETE',
        tokenHash: issued.tokenHash,
        expiresAt: issued.expiresAt,
      },
    }),
  ]);

  const template = accountDeleteConfirmEmail({
    username: user.username,
    url: emailTokenUrl('ACCOUNT_DELETE', issued.token),
    expiresMinutes: ACCOUNT_DELETE_TTL_MINUTES,
  });
  const sent = await sendEmail({
    kind: 'account-delete-confirm',
    to: user.email,
    ...template,
  });
  if (!sent.ok) {
    // Do not leave a link nobody received.
    await prisma.emailToken.deleteMany({
      where: {
        userId,
        kind: 'ACCOUNT_DELETE',
        tokenHash: issued.tokenHash,
      },
    });
    return { ok: false, reason: 'send-failed' };
  }

  return { ok: true, email: user.email, expiresAt: issued.expiresAt };
}

export async function getAccountDeleteState(
  token: string | null | undefined,
  now: Date = new Date(),
): Promise<EmailTokenState> {
  if (!token) return 'invalid';

  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: { kind: true, usedAt: true, expiresAt: true },
  });
  if (!row || row.kind !== 'ACCOUNT_DELETE') return 'invalid';
  if (row.usedAt) return 'used';
  if (row.expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'valid';
}

export type ConsumeAccountDeleteResult =
  | { ok: true; email: string; username: string | null }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' | 'forbidden' };

/**
 * Single-use and race-safe: the token is claimed inside the same transaction
 * that deletes the account. `userId` must be the signed-in user the link was
 * issued to, so a forwarded email cannot destroy someone else's account.
 */
export async function consumeAccountDelete({
  token,
  userId,
  now = new Date(),
}: {
  token: string;
  userId: string;
  now?: Date;
}): Promise<ConsumeAccountDeleteResult> {
  const row = await prisma.emailToken.findUnique({
    where: { tokenHash: hashEmailToken(token) },
    select: {
      id: true,
      userId: true,
      kind: true,
      usedAt: true,
      expiresAt: true,
      user: {
        select: {
          email: true,
          username: true,
          platinums: { select: { id: true, imageUrl: true, hash: true } },
        },
      },
    },
  });

  if (!row || row.kind !== 'ACCOUNT_DELETE') {
    return { ok: false, reason: 'invalid' };
  }
  if (row.usedAt) return { ok: false, reason: 'used' };
  if (row.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: 'expired' };
  }
  if (row.userId !== userId) return { ok: false, reason: 'forbidden' };

  const deleted = await deleteAccountData(
    {
      id: row.userId,
      username: row.user.username,
      platinums: row.user.platinums,
    },
    { tokenId: row.id, now },
  );
  if (!deleted.ok) return { ok: false, reason: 'used' };

  const notice = accountDeletedEmail({
    username: row.user.username,
    deletedAt: now,
  });
  await sendEmail({
    kind: 'account-deleted',
    to: row.user.email,
    ...notice,
  });

  return { ok: true, email: row.user.email, username: row.user.username };
}
