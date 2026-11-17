import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearMosaicCacheForTesting,
  getCachedMosaic,
  setCachedMosaic,
} from '@/lib/pixelate-cache';

const hash = (n: number) => `hash-${String(n).padStart(60, '0')}`;

beforeEach(() => {
  clearMosaicCacheForTesting();
});

describe('pixelate cache (LRU)', () => {
  it('returns undefined for an unknown hash and stores a known one', () => {
    expect(getCachedMosaic(hash(1))).toBeUndefined();
    const mosaic = Buffer.from([1, 2, 3]);
    setCachedMosaic(hash(1), mosaic);
    expect(getCachedMosaic(hash(1))).toBe(mosaic);
  });

  it('evicts the oldest entry once the cap is exceeded', () => {
    for (let i = 0; i < 100; i += 1) {
      setCachedMosaic(hash(i), Buffer.from(String(i)));
    }
    // Oldest (hash 0) is the victim of the 101st entry.
    setCachedMosaic(hash(100), Buffer.from('100'));
    expect(getCachedMosaic(hash(0))).toBeUndefined();
    expect(getCachedMosaic(hash(1))).toBeDefined();
    expect(getCachedMosaic(hash(100))).toBeDefined();
  });

  it('refreshes recency on read so a recently touched entry survives', () => {
    for (let i = 0; i < 100; i += 1) {
      setCachedMosaic(hash(i), Buffer.from(String(i)));
    }
    // Touch the oldest entry: the victim becomes the second-oldest instead.
    getCachedMosaic(hash(0));
    setCachedMosaic(hash(100), Buffer.from('100'));
    expect(getCachedMosaic(hash(0))).toBeDefined();
    expect(getCachedMosaic(hash(1))).toBeUndefined();
  });
});
