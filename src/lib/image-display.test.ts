import { describe, expect, it } from 'vitest';
import { displayImageUrl, isPlateUnderModeration } from '@/lib/image-display';

describe('isPlateUnderModeration', () => {
  it('is only false for published plates', () => {
    expect(isPlateUnderModeration('PUBLISHED')).toBe(false);
    expect(isPlateUnderModeration('UNDER_REVIEW')).toBe(true);
    expect(isPlateUnderModeration('HIDDEN')).toBe(true);
  });
});

describe('displayImageUrl', () => {
  it('keeps the raw url for published plates', () => {
    expect(displayImageUrl('/api/images/platinums/abc.avif', 'PUBLISHED')).toBe(
      '/api/images/platinums/abc.avif',
    );
  });

  it('asks for the pixelated variant while a plate is under moderation', () => {
    expect(displayImageUrl('/api/images/platinums/abc.avif', 'UNDER_REVIEW')).toBe(
      '/api/images/platinums/abc.avif?fx=pixel',
    );
    expect(displayImageUrl('/api/images/platinums/abc.avif', 'HIDDEN')).toBe(
      '/api/images/platinums/abc.avif?fx=pixel',
    );
  });

  it('appends to an existing query string', () => {
    expect(displayImageUrl('/api/images/abc.avif?v=2', 'HIDDEN')).toBe(
      '/api/images/abc.avif?v=2&fx=pixel',
    );
  });
});
