import { describe, expect, it } from 'vitest';
import {
  isAccountLocked,
  nextLockUntil,
  LOCK_THRESHOLD,
} from '@/lib/account-lockout';

describe('account lockout', () => {
  const now = new Date('2026-11-18T10:00:00Z');

  it('does not lock before the threshold', () => {
    expect(nextLockUntil(LOCK_THRESHOLD - 1, now)).toBeNull();
  });

  it('locks for 15 minutes at the threshold', () => {
    const until = nextLockUntil(LOCK_THRESHOLD, now)!;
    expect(until.getTime() - now.getTime()).toBe(15 * 60_000);
  });

  it('doubles the duration per extra failure, capped at 24h', () => {
    expect(
      nextLockUntil(LOCK_THRESHOLD + 1, now)!.getTime() - now.getTime(),
    ).toBe(30 * 60_000);
    expect(
      nextLockUntil(LOCK_THRESHOLD + 20, now)!.getTime() - now.getTime(),
    ).toBe(24 * 60 * 60_000);
  });

  it('is locked only while lockedUntil is in the future', () => {
    expect(isAccountLocked(new Date(now.getTime() + 60_000), now)).toBe(true);
    expect(isAccountLocked(new Date(now.getTime() - 60_000), now)).toBe(false);
    expect(isAccountLocked(null, now)).toBe(false);
  });
});
