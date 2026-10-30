import { describe, expect, it } from 'vitest';
import { aheadOfPercent, hasHuntersBehind, MIN_STANDING_HUNTERS } from '@/lib/standing';

describe('aheadOfPercent', () => {
  it('hides the percentage until the board is big enough', () => {
    expect(aheadOfPercent({ hunters: MIN_STANDING_HUNTERS - 1, below: 8 })).toBeNull();
    expect(aheadOfPercent({ hunters: 0, below: 0 })).toBeNull();
  });

  it('rounds the share of hunters behind the player', () => {
    expect(aheadOfPercent({ hunters: 10, below: 8 })).toBe(80);
    expect(aheadOfPercent({ hunters: 3, below: 1 })).toBeNull();
    expect(aheadOfPercent({ hunters: 6, below: 2 })).toBeNull();
    expect(aheadOfPercent({ hunters: 12, below: 5 })).toBe(42);
  });

  it('clamps out-of-range counts instead of showing over 100%', () => {
    expect(aheadOfPercent({ hunters: 20, below: 99 })).toBe(100);
    expect(aheadOfPercent({ hunters: 20, below: -3 })).toBe(0);
  });
});

describe('hasHuntersBehind', () => {
  it('is false at the bottom of the board', () => {
    expect(hasHuntersBehind(0)).toBe(false);
    expect(hasHuntersBehind(1)).toBe(true);
  });
});
