import { describe, expect, it } from 'vitest';
import { daysUntilMonthEnd, getRaceState } from '@/lib/race';

describe('daysUntilMonthEnd', () => {
  it('counts down a 31-day month', () => {
    expect(daysUntilMonthEnd(new Date(2026, 0, 15))).toBe(16);
  });

  it('handles a common-year February', () => {
    expect(daysUntilMonthEnd(new Date(2026, 1, 10))).toBe(18);
  });

  it('handles a leap-year February', () => {
    expect(daysUntilMonthEnd(new Date(2028, 1, 27))).toBe(2);
  });

  it('returns 0 on the last day of the month', () => {
    expect(daysUntilMonthEnd(new Date(2026, 8, 30))).toBe(0);
  });
});

describe('getRaceState', () => {
  it('pairs the countdown with a readable month label', () => {
    expect(getRaceState(new Date(2026, 0, 15))).toEqual({
      daysLeft: 16,
      monthLabel: 'January 2026',
    });
  });

  it('labels December correctly', () => {
    expect(getRaceState(new Date(2026, 11, 25))).toEqual({
      daysLeft: 6,
      monthLabel: 'December 2026',
    });
  });
});
