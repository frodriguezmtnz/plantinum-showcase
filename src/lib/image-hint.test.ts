import { describe, expect, it } from 'vitest';
import { buildImageHint } from '@/lib/image-hint';

describe('buildImageHint', () => {
  it('slugifies the first four words', () => {
    expect(buildImageHint('The Legend of Zelda Tears of the Kingdom')).toBe('the-legend-of-zelda');
  });

  it('strips punctuation and collapses separators', () => {
    expect(buildImageHint("Marvel's Spider-Man: Miles Morales")).toBe('marvel-s-spider-man');
  });

  it('falls back when there is nothing to slugify', () => {
    expect(buildImageHint('   !!!   ')).toBe('game screenshot');
    expect(buildImageHint('')).toBe('game screenshot');
  });
});
