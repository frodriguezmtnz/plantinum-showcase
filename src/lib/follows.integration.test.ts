import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Postgres integration suite for the follow graph. Like the data suite it only
 * runs when TEST_DATABASE_URL is set (CI points it at the service DB after
 * `prisma migrate deploy`); rows use a per-run stamp and are cleaned up.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('follows.ts — Postgres integration', () => {
  let follows: typeof import('@/lib/follows');
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  const stamp = Date.now();
  const u = {
    alice: `it-follow-${stamp}-alice`,
    bob: `it-follow-${stamp}-bob`,
    carol: `it-follow-${stamp}-carol`,
    temp: `it-follow-${stamp}-temp`,
  };

  const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    follows = await import('@/lib/follows');
    prisma = (await import('@/lib/prisma')).prisma;

    await prisma.user.createMany({
      data: [
        { id: u.alice, email: `it-follow-alice-${stamp}@test.local`, username: `it_follow_alice_${stamp}` },
        { id: u.bob, email: `it-follow-bob-${stamp}@test.local`, username: `it_follow_bob_${stamp}` },
        { id: u.carol, email: `it-follow-carol-${stamp}@test.local`, username: `it_follow_carol_${stamp}` },
        { id: u.temp, email: `it-follow-temp-${stamp}@test.local`, username: `it_follow_temp_${stamp}` },
      ],
    });

    await prisma.follow.createMany({
      data: [
        { followerId: u.bob, followingId: u.alice, createdAt: at(1) },
        { followerId: u.carol, followingId: u.alice, createdAt: at(2) },
        { followerId: u.alice, followingId: u.bob, createdAt: at(3) },
        { followerId: u.alice, followingId: u.carol, createdAt: at(4) },
      ],
    });
  });

  afterAll(async () => {
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: Object.values(u) } },
          { followingId: { in: Object.values(u) } },
        ],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(u) } } });
    await prisma.$disconnect();
  });

  it('counts both directions and reports the viewer edge', async () => {
    const state = await follows.getFollowState(u.alice, u.carol);
    expect(state).toEqual({ isFollowing: true, followers: 2, following: 2 });
  });

  it('never reports a self-follow for the owner', async () => {
    const state = await follows.getFollowState(u.alice, u.alice);
    expect(state.isFollowing).toBe(false);
  });

  it('lists followers newest first and flags the viewer edges', async () => {
    const page = await follows.getFollowersPage(u.alice, { viewerId: u.alice });
    expect(page.total).toBe(2);
    expect(page.hasMore).toBe(false);
    expect(page.items.map((item) => item.id)).toEqual([u.carol, u.bob]);
    // Alice follows both of them, so the inline buttons read "Following".
    expect(page.items.every((item) => item.isFollowing)).toBe(true);
  });

  it('paginates the following list without duplicates', async () => {
    const first = await follows.getFollowingPage(u.alice, {
      viewerId: u.bob,
      limit: 1,
    });
    expect(first.total).toBe(2);
    expect(first.hasMore).toBe(true);
    expect(first.items.map((item) => item.id)).toEqual([u.carol]);
    expect(first.items[0]!.isFollowing).toBe(false);

    const second = await follows.getFollowingPage(u.alice, {
      viewerId: u.bob,
      offset: 1,
      limit: 1,
    });
    expect(second.hasMore).toBe(false);
    expect(second.items.map((item) => item.id)).toEqual([u.bob]);
  });

  it('cascades follow edges when an account is deleted', async () => {
    await prisma.follow.create({
      data: { followerId: u.temp, followingId: u.alice, createdAt: at(5) },
    });
    await prisma.user.delete({ where: { id: u.temp } });

    const orphans = await prisma.follow.count({
      where: { followerId: u.temp },
    });
    expect(orphans).toBe(0);
  });
});
