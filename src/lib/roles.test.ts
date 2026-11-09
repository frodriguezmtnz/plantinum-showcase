import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique } },
}));

import { getModeratorAccess, getUserRole, isModerator } from '@/lib/roles';

beforeEach(() => {
  findUnique.mockReset();
});

describe('isModerator', () => {
  it('allows ADMIN and MODERATOR', async () => {
    findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
    expect(await isModerator('admin')).toBe(true);

    findUnique.mockResolvedValueOnce({ role: 'MODERATOR' });
    expect(await isModerator('mod')).toBe(true);
  });

  it('denies USER and unknown users', async () => {
    findUnique.mockResolvedValueOnce({ role: 'USER' });
    expect(await isModerator('user')).toBe(false);

    findUnique.mockResolvedValueOnce(null);
    expect(await isModerator('missing')).toBe(false);
  });
});

describe('getUserRole', () => {
  it('re-reads the role and falls back to USER when the row is gone', async () => {
    findUnique.mockResolvedValueOnce({ role: 'ADMIN' });
    expect(await getUserRole('admin')).toBe('ADMIN');

    findUnique.mockResolvedValueOnce(null);
    expect(await getUserRole('gone')).toBe('USER');
  });
});

describe('getModeratorAccess', () => {
  it('returns the moderator flag and 2FA state together', async () => {
    findUnique.mockResolvedValueOnce({
      role: 'MODERATOR',
      twoFactorEnabled: true,
    });
    expect(await getModeratorAccess('mod')).toEqual({
      isModerator: true,
      twoFactorEnabled: true,
    });

    findUnique.mockResolvedValueOnce({
      role: 'USER',
      twoFactorEnabled: false,
    });
    expect(await getModeratorAccess('user')).toEqual({
      isModerator: false,
      twoFactorEnabled: false,
    });

    findUnique.mockResolvedValueOnce(null);
    expect(await getModeratorAccess('missing')).toEqual({
      isModerator: false,
      twoFactorEnabled: false,
    });
  });
});
