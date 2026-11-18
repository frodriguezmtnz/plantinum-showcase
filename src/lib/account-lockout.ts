import { prisma } from '@/lib/prisma';

/**
 * Persistent brute-force lockout. The sliding-window rate limit only caps
 * bursts; a patient attacker gets ~2.300 password tries/day/account forever.
 * These columns accumulate failures across windows and lock the account with
 * progressive backoff. Cleared on a successful password check, a password
 * change and a password reset.
 */

export const LOCK_THRESHOLD = 10;

/** Duration of the first lock; doubles with every extra failure past it. */
const BASE_LOCK_MS = 15 * 60_000;
const MAX_LOCK_MS = 24 * 60 * 60_000;

export function isAccountLocked(
  lockedUntil: Date | null,
  now: Date = new Date(),
): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

/** Lock schedule: null until the threshold, then 15min, 30min, 1h... capped
 * at 24h. `failedAttempts` is the count *including* the attempt being
 * registered. */
export function nextLockUntil(
  failedAttempts: number,
  now: Date = new Date(),
): Date | null {
  if (failedAttempts < LOCK_THRESHOLD) return null;
  const exponent = failedAttempts - LOCK_THRESHOLD;
  const duration = Math.min(BASE_LOCK_MS * 2 ** exponent, MAX_LOCK_MS);
  return new Date(now.getTime() + duration);
}

export async function registerFailedPasswordAttempt(
  userId: string,
  currentAttempts: number,
): Promise<void> {
  const attempts = currentAttempts + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: attempts,
      lockedUntil: nextLockUntil(attempts),
    },
  });
}

export async function clearFailedPasswordAttempts(
  userId: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}
