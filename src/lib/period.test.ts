import { describe, expect, it } from 'vitest';
import { getCurrentPeriod } from '@/lib/period';

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
