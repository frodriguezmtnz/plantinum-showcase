import { describe, expect, it } from 'vitest';
import {
  formatPeriodLabel,
  getCurrentPeriod,
  getPreviousPeriod,
  shiftPeriod,
} from '@/lib/period';

describe('getCurrentPeriod', () => {
  it('formats a mid-month date as YYYY-MM', () => {
    expect(getCurrentPeriod(new Date('2026-09-15T12:00:00Z'))).toBe('2026-09');
  });

  it('rolls to the next month at Madrid midnight (winter, UTC+1)', () => {
    expect(getCurrentPeriod(new Date('2026-01-31T22:59:59Z'))).toBe('2026-01');
    expect(getCurrentPeriod(new Date('2026-01-31T23:00:00Z'))).toBe('2026-02');
  });

  it('rolls to the next month at Madrid midnight (summer, UTC+2)', () => {
    expect(getCurrentPeriod(new Date('2026-05-31T21:59:59Z'))).toBe('2026-05');
    expect(getCurrentPeriod(new Date('2026-05-31T22:00:00Z'))).toBe('2026-06');
  });

  it('rolls over the year boundary', () => {
    expect(getCurrentPeriod(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01');
  });

  it('zero-pads single-digit months', () => {
    expect(getCurrentPeriod(new Date('2026-03-01T12:00:00Z'))).toBe('2026-03');
  });
});

describe('shiftPeriod', () => {
  it('steps back a month', () => {
    expect(shiftPeriod('2026-10', -1)).toBe('2026-09');
  });

  it('steps forward across a year boundary', () => {
    expect(shiftPeriod('2026-12', 1)).toBe('2027-01');
  });

  it('steps back across a year boundary', () => {
    expect(shiftPeriod('2026-01', -1)).toBe('2025-12');
  });

  it('skips multiple months at once', () => {
    expect(shiftPeriod('2026-03', -5)).toBe('2025-10');
  });
});

describe('getPreviousPeriod', () => {
  it('returns the Madrid month before the date', () => {
    expect(getPreviousPeriod(new Date('2026-10-15T12:00:00Z'))).toBe('2026-09');
  });

  it('rolls back across the year boundary on the Madrid clock', () => {
    expect(getPreviousPeriod(new Date('2026-01-01T00:30:00Z'))).toBe('2025-12');
  });
});

describe('formatPeriodLabel', () => {
  it('renders a readable month and year', () => {
    expect(formatPeriodLabel('2026-09')).toBe('September 2026');
  });

  it('does not slip a month on the first of the month', () => {
    expect(formatPeriodLabel('2026-01')).toBe('January 2026');
  });
});
