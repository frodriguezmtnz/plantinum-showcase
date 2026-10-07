import { describe, expect, it } from 'vitest';
import { canServeStoredImage } from '@/lib/image-access';

const owner = 'owner-1';
const other = 'other-1';

describe('canServeStoredImage', () => {
  it('serves an image used by a published plate to anyone', () => {
    expect(
      canServeStoredImage([{ userId: owner, moderationStatus: 'PUBLISHED' }]),
    ).toBe(true);
  });

  it('denies an unknown hash', () => {
    expect(canServeStoredImage([])).toBe(false);
  });

  it('denies a hidden plate to anonymous and other viewers', () => {
    const plates = [{ userId: owner, moderationStatus: 'HIDDEN' }];
    expect(canServeStoredImage(plates)).toBe(false);
    expect(canServeStoredImage(plates, { id: other })).toBe(false);
  });

  it('allows the owner of a hidden plate', () => {
    expect(
      canServeStoredImage([{ userId: owner, moderationStatus: 'HIDDEN' }], {
        id: owner,
      }),
    ).toBe(true);
  });

  it('allows a moderator even when not the owner', () => {
    expect(
      canServeStoredImage([{ userId: owner, moderationStatus: 'HIDDEN' }], {
        id: other,
        isModerator: true,
      }),
    ).toBe(true);
  });

  it('serves the image if any plate sharing the hash is published', () => {
    expect(
      canServeStoredImage([
        { userId: owner, moderationStatus: 'HIDDEN' },
        { userId: other, moderationStatus: 'PUBLISHED' },
      ]),
    ).toBe(true);
  });
});
