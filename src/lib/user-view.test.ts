import { describe, expect, it } from 'vitest';
import { toUserView } from '@/lib/data';

describe('toUserView', () => {
  it('projects only the public fields and drops auth-only columns', () => {
    const view = toUserView({
      id: 'u1',
      username: 'ana',
      image: 'https://example.test/ana.png',
      passwordHash: '$2b$12$secret',
      sessionVersion: 3,
      failedLoginAttempts: 5,
      lockedUntil: new Date(),
      twoFactorSecret: 'encrypted',
    } as never);

    expect(view).toEqual({
      id: 'u1',
      username: 'ana',
      avatarUrl: 'https://example.test/ana.png',
    });
    expect(Object.keys(view).sort()).toEqual(['avatarUrl', 'id', 'username']);
  });

  it('falls back to Unknown and a generated avatar', () => {
    const view = toUserView({ id: 'u2', username: null, image: null });

    expect(view.username).toBe('Unknown');
    expect(view.avatarUrl).toBe('/api/generated-avatars/u2?v=1');
  });
});
