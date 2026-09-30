import { describe, expect, it } from 'vitest';
import { planConfig, uploadsRemaining, quotaReached, nextPlan } from '@/lib/plans';

describe('planConfig', () => {
  it('maps each tier to its entitlements', () => {
    expect(planConfig('FREE')).toEqual({ monthlyUploadLimit: 3, watermark: true });
    expect(planConfig('PRO')).toEqual({ monthlyUploadLimit: 10, watermark: false });
    expect(planConfig('PLATINUM')).toEqual({ monthlyUploadLimit: Infinity, watermark: false });
  });

  it('falls back to FREE for unknown, null or missing plans', () => {
    const free = planConfig('FREE');
    expect(planConfig('GOLD')).toEqual(free);
    expect(planConfig(null)).toEqual(free);
    expect(planConfig(undefined)).toEqual(free);
  });
});

describe('uploadsRemaining / quotaReached', () => {
  it('counts down the free allowance', () => {
    expect(uploadsRemaining(0, 'FREE')).toBe(3);
    expect(uploadsRemaining(2, 'FREE')).toBe(1);
    expect(uploadsRemaining(3, 'FREE')).toBe(0);
  });

  it('never goes negative', () => {
    expect(uploadsRemaining(9, 'FREE')).toBe(0);
  });

  it('treats PLATINUM as unlimited', () => {
    expect(uploadsRemaining(999, 'PLATINUM')).toBe(Infinity);
    expect(quotaReached(999, 'PLATINUM')).toBe(false);
  });

  it('reaches quota exactly at the limit', () => {
    expect(quotaReached(9, 'PRO')).toBe(false);
    expect(quotaReached(10, 'PRO')).toBe(true);
  });
});

describe('nextPlan', () => {
  it('walks the ladder up to PLATINUM', () => {
    expect(nextPlan('FREE')).toBe('PRO');
    expect(nextPlan('PRO')).toBe('PLATINUM');
    expect(nextPlan('PLATINUM')).toBeNull();
    expect(nextPlan('mystery')).toBe('PRO');
  });
});
