'use server';

import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  buildTotpQrDataUrl,
  buildTotpUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  hashRecoveryCode,
  TwoFactorConfigError,
  verifyTotpCode,
  verifyTwoFactorCode,
} from '@/lib/two-factor';

const RATE_LIMITED =
  'Too many two-factor changes at once. Please wait a moment and try again.';
const NOT_CONFIGURED =
  'Two-factor authentication is not available right now. Try again later.';
const INVALID_CODE = 'That authentication code is not valid. Try again.';

export type TwoFactorSetupResult =
  | { success: true; secret: string; qrDataUrl: string }
  | { success: false; error: string };

export type TwoFactorConfirmResult =
  | { success: true; recoveryCodes: string[] }
  | { success: false; error: string };

export type TwoFactorActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function verifyCurrentPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) return true;
  return bcrypt.compare(password, user.passwordHash);
}

/**
 * Starts 2FA enrolment: generates the secret, stores it encrypted (still
 * disabled) and returns the QR payload for the authenticator app.
 */
export async function beginTwoFactorSetup(
  formData: FormData,
): Promise<TwoFactorSetupResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: 'You need to sign in first.' };

  if (!(await checkRateLimit(`2fa-setup:${userId}`, 5, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const password = String(formData.get('password') ?? '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      twoFactorEnabled: true,
      passwordHash: true,
    },
  });
  if (!user) return { success: false, error: 'Your account could not be found.' };
  if (user.twoFactorEnabled) {
    return { success: false, error: 'Two-factor authentication is already on.' };
  }
  if (!user.passwordHash) {
    return {
      success: false,
      error: 'Set a password on this account before enabling two-factor authentication.',
    };
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return { success: false, error: 'Your current password is incorrect.' };
  }

  try {
    const secret = generateTwoFactorSecret();
    const encrypted = encryptTwoFactorSecret(secret);
    const uri = buildTotpUri(secret, user.username ?? user.email);
    const qrDataUrl = await buildTotpQrDataUrl(uri);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encrypted,
        twoFactorEnabled: false,
        twoFactorEnabledAt: null,
      },
    });

    return { success: true, secret, qrDataUrl };
  } catch (error) {
    if (error instanceof TwoFactorConfigError) {
      return { success: false, error: NOT_CONFIGURED };
    }
    throw error;
  }
}

/** Confirms enrolment with a current TOTP code and returns the recovery codes. */
export async function confirmTwoFactorSetup(
  formData: FormData,
): Promise<TwoFactorConfirmResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: 'You need to sign in first.' };

  if (!(await checkRateLimit(`2fa-confirm:${userId}`, 10, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const code = String(formData.get('code') ?? '');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });
  if (!user) return { success: false, error: 'Your account could not be found.' };
  if (user.twoFactorEnabled) {
    return { success: false, error: 'Two-factor authentication is already on.' };
  }
  if (!user.twoFactorSecret) {
    return { success: false, error: 'Start the setup again to get a new QR code.' };
  }

  try {
    const secret = decryptTwoFactorSecret(user.twoFactorSecret);
    if (!(await verifyTotpCode(secret, code))) {
      return { success: false, error: INVALID_CODE };
    }

    const recoveryCodes = generateRecoveryCodes();
    await prisma.$transaction(async (tx) => {
      await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
      await tx.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorEnabledAt: new Date(),
          sessionVersion: { increment: 1 },
        },
      });
      await tx.twoFactorRecoveryCode.createMany({
        data: recoveryCodes.map((recoveryCode) => ({
          userId,
          codeHash: hashRecoveryCode(recoveryCode),
        })),
      });
    });

    // Do not revalidate here: the sessionVersion bump invalidates this session,
    // and the client must show the one-time recovery codes before signing out.
    return { success: true, recoveryCodes };
  } catch (error) {
    if (error instanceof TwoFactorConfigError) {
      return { success: false, error: NOT_CONFIGURED };
    }
    throw error;
  }
}

async function verifySettingsSecondFactor(
  userId: string,
  password: string,
  code: string,
): Promise<string | null> {
  if (!(await verifyCurrentPassword(userId, password))) {
    return 'Your current password is incorrect.';
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return 'Two-factor authentication is not enabled on this account.';
  }

  try {
    const valid = await verifyTwoFactorCode(
      userId,
      user.twoFactorSecret,
      code,
    );
    return valid ? null : INVALID_CODE;
  } catch (error) {
    if (error instanceof TwoFactorConfigError) return NOT_CONFIGURED;
    throw error;
  }
}

export async function disableTwoFactor(
  formData: FormData,
): Promise<TwoFactorActionResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: 'You need to sign in first.' };

  if (!(await checkRateLimit(`2fa-disable:${userId}`, 5, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const password = String(formData.get('password') ?? '');
  const code = String(formData.get('code') ?? '');
  const problem = await verifySettingsSecondFactor(userId, password, code);
  if (problem) return { success: false, error: problem };

  await prisma.$transaction(async (tx) => {
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        sessionVersion: { increment: 1 },
      },
    });
  });

  return { success: true };
}

export async function regenerateRecoveryCodes(
  formData: FormData,
): Promise<TwoFactorConfirmResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: 'You need to sign in first.' };

  if (!(await checkRateLimit(`2fa-recovery:${userId}`, 5, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const password = String(formData.get('password') ?? '');
  const code = String(formData.get('code') ?? '');
  const problem = await verifySettingsSecondFactor(userId, password, code);
  if (problem) return { success: false, error: problem };

  const recoveryCodes = generateRecoveryCodes();
  await prisma.$transaction(async (tx) => {
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.twoFactorRecoveryCode.createMany({
      data: recoveryCodes.map((recoveryCode) => ({
        userId,
        codeHash: hashRecoveryCode(recoveryCode),
      })),
    });
  });

  revalidatePath('/settings');
  return { success: true, recoveryCodes };
}
