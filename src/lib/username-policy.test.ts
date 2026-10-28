import { describe, expect, it } from 'vitest';
import {
  formatUsernameChangeDate,
  nextUsernameChangeAt,
  usernameCooldownStatus,
} from '@/lib/username-policy';

describe('usernameCooldownStatus', () => {
  it('is unlocked when the handle never changed', () => {
    expect(usernameCooldownStatus(null)).toEqual({ locked: false, nextAt: null });
  });

  it('locks for twelve months after a change', () => {
    const changedAt = new Date('2026-01-15T00:00:00.000Z');
    const now = new Date('2026-06-01T00:00:00.000Z');
    const status = usernameCooldownStatus(changedAt, now);

    expect(status.locked).toBe(true);
    expect(status.nextAt?.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('unlocks once the year has passed', () => {
    const changedAt = new Date('2025-01-15T00:00:00.000Z');
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(usernameCooldownStatus(changedAt, now).locked).toBe(false);
  });

  it('adds exactly twelve months', () => {
    expect(nextUsernameChangeAt('2026-03-31T12:00:00.000Z').toISOString()).toBe(
      '2027-03-31T12:00:00.000Z',
    );
  });

  it('formats the next date deterministically in UTC', () => {
    expect(formatUsernameChangeDate(new Date('2027-01-15T00:00:00.000Z'))).toBe(
      'January 15, 2027',
    );
  });
});
