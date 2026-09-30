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

  it('reads the Madrid clock, not the server clock, at the month boundary', () => {
    // 22:30 UTC on Sep 30 is already Oct 1 in Madrid (CEST).
    expect(daysUntilMonthEnd(new Date('2026-09-30T22:30:00Z'))).toBe(30);
    // 23:30 UTC on Jan 31 is Feb 1 in Madrid (CET).
    expect(daysUntilMonthEnd(new Date('2026-01-31T23:30:00Z'))).toBe(27);
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

  it('rolls the label over at the Madrid month boundary, not the UTC one', () => {
    expect(getRaceState(new Date('2025-12-31T23:30:00Z'))).toEqual({
      daysLeft: 30,
      monthLabel: 'January 2026',
    });
    expect(getRaceState(new Date('2026-09-30T22:30:00Z'))).toEqual({
      daysLeft: 30,
      monthLabel: 'October 2026',
    });
  });
});
