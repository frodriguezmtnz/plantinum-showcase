import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * End-to-end integration for the rename action: exercises the real
 * updateUsername transaction (reservation + notification repoint) with a
 * disposable pair of accounts. Runs only when TEST_DATABASE_URL is set.
 */
const url = process.env.TEST_DATABASE_URL;

const authState = vi.hoisted(() => ({ userId: '' }));

vi.mock('@/auth', () => ({
  auth: async () => ({ user: { id: authState.userId } }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: () => {},
}));

describe.skipIf(!url)('updateUsername — rename integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let updateUsername: typeof import('@/app/settings/actions')['updateUsername'];

  const stamp = Date.now();
  const suffix = String(stamp).slice(-8);
  const handle = {
    old: `rn_old_${suffix}`,
    next: `rn_new_${suffix}`,
  };
  const u = {
    owner: `it-rename-${stamp}-owner`,
    follower: `it-rename-${stamp}-follower`,
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    prisma = (await import('@/lib/prisma')).prisma;
    updateUsername = (await import('@/app/settings/actions')).updateUsername;

    authState.userId = u.owner;

    await prisma.user.createMany({
      data: [
        {
          id: u.owner,
          email: `it-rename-owner-${stamp}@test.local`,
          username: handle.old,
        },
        {
          id: u.follower,
          email: `it-rename-follower-${stamp}@test.local`,
          username: `it_rn_f_${suffix}`,
        },
      ],
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: u.follower,
          kind: 'NEW_FOLLOWER',
          title: `@${handle.old} started following you`,
          linkUrl: `/u/${handle.old}`,
        },
        {
          userId: u.follower,
          kind: 'FOLLOWED_PLATE',
          title: `@${handle.old} posted a new platinum`,
          linkUrl: `/u/${handle.old}`,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: { in: [u.owner, u.follower] } },
    });
    await prisma.usernameHistory.deleteMany({
      where: {
        usernameLower: {
          in: [handle.old.toLowerCase(), handle.next.toLowerCase()],
        },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [u.owner, u.follower] } } });
    await prisma.$disconnect();
  });

  it('reserves the old handle and repoints notifications to the new one', async () => {
    const result = await updateUsername(handle.next);
    expect(result.success).toBe(true);

    const user = await prisma.user.findUnique({
      where: { id: u.owner },
      select: { username: true, usernameChangedAt: true },
    });
    expect(user?.username).toBe(handle.next);
    expect(user?.usernameChangedAt).toBeInstanceOf(Date);

    const reserved = await prisma.usernameHistory.findUnique({
      where: { usernameLower: handle.old.toLowerCase() },
      select: { userId: true },
    });
    expect(reserved?.userId).toBe(u.owner);

    const notices = await prisma.notification.findMany({
      where: { userId: u.follower },
      orderBy: { kind: 'asc' },
      select: { title: true, linkUrl: true },
    });
    expect(notices).toHaveLength(2);
    expect(notices.every((row) => row.linkUrl === `/u/${handle.next}`)).toBe(
      true,
    );
    expect(notices.every((row) => row.title.includes(`@${handle.next}`))).toBe(
      true,
    );
  });
});
