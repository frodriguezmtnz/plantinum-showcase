import { describe, expect, it } from 'vitest';
import { isAvatarUserId } from '@/lib/avatar';

describe('isAvatarUserId', () => {
  it('accepts both cuids and legacy seeded ids', () => {
    expect(isAvatarUserId('cmvshudob0000y4nh1c1dvgpq')).toBe(true);
    expect(isAvatarUserId('1')).toBe(true);
    expect(isAvatarUserId('trophy-hunter_1')).toBe(true);
  });

  it('rejects path traversal and empty ids', () => {
    expect(isAvatarUserId('')).toBe(false);
    expect(isAvatarUserId('../secret')).toBe(false);
    expect(isAvatarUserId('a/b')).toBe(false);
    expect(isAvatarUserId('a.b')).toBe(false);
    expect(isAvatarUserId('a'.repeat(65))).toBe(false);
  });
});
