import { describe, expect, it } from 'vitest';
import { resolveProfileGalleryPages } from '@/lib/profile-gallery';

const page1 = ['a', 'b', 'c'];
const page2 = ['d', 'e'];

describe('resolveProfileGalleryPages', () => {
  it('returns the server page when no extras were loaded', () => {
    expect(resolveProfileGalleryPages(page1, 3, false, null)).toEqual({
      items: page1,
      total: 3,
      hasMore: false,
    });
  });

  it('appends the extra pages while the server total is unchanged', () => {
    const result = resolveProfileGalleryPages(page1, 5, true, {
      total: 5,
      items: page2,
      hasMore: false,
    });

    expect(result.items).toEqual([...page1, ...page2]);
    expect(result.total).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('drops stale extras when the server total changes (a platinum was deleted)', () => {
    const deleted = resolveProfileGalleryPages(page1, 4, true, {
      total: 5,
      items: page2,
      hasMore: false,
    });

    expect(deleted.items).toEqual(page1);
    expect(deleted.total).toBe(4);
    expect(deleted.hasMore).toBe(true);
  });

  it('keeps the first page identity when extras are dropped', () => {
    const result = resolveProfileGalleryPages(page1, 2, false, {
      total: 5,
      items: page2,
      hasMore: true,
    });

    expect(result.items).toBe(page1);
  });
});
