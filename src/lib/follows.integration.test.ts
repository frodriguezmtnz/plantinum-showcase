import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCurrentPeriod } from '@/lib/period';

/**
 * Postgres integration suite for the follow graph. Like the data suite it only
 * runs when TEST_DATABASE_URL is set (CI points it at the service DB after
 * `prisma migrate deploy`); rows use a per-run stamp and are cleaned up.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('follows.ts — Postgres integration', () => {
  let follows: typeof import('@/lib/follows');
  let data: typeof import('@/lib/data');
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  const stamp = Date.now();
  const u = {
    alice: `it-follow-${stamp}-alice`,
    bob: `it-follow-${stamp}-bob`,
    carol: `it-follow-${stamp}-carol`,
    temp: `it-follow-${stamp}-temp`,
  };

  const at = (seconds: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, seconds));

  const period = getCurrentPeriod();
  const p = {
    aliceNew: `it-follow-${stamp}-plate-alice-new`,
    aliceOld: `it-follow-${stamp}-plate-alice-old`,
    aliceHidden: `it-follow-${stamp}-plate-alice-hidden`,
    bob: `it-follow-${stamp}-plate-bob`,
    carol: `it-follow-${stamp}-plate-carol`,
  };

  const plate = (
    id: string,
    userId: string,
    gameName: string,
    monthlyVotes: number,
    platinumDate: string,
    moderationStatus: 'PUBLISHED' | 'HIDDEN' = 'PUBLISHED',
  ) => ({
    id,
    userId,
    gameName,
    platform: 'PS5',
    hash: `hash-${id}`,
    imageUrl: `https://example.test/${id}.avif`,
    imageHint: 'test',
    width: 1600,
    height: 900,
    votes: monthlyVotes,
    monthlyVotes,
    monthlyVotesMonth: monthlyVotes > 0 ? period : null,
    platinumDate: new Date(platinumDate),
    moderationStatus,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    follows = await import('@/lib/follows');
    data = await import('@/lib/data');
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

    await prisma.platinum.createMany({
      data: [
        plate(p.aliceNew, u.alice, 'Alice New', 3, '2026-02-01'),
        plate(p.aliceOld, u.alice, 'Alice Old', 0, '2026-01-01'),
        plate(p.aliceHidden, u.alice, 'Alice Hidden', 9, '2026-03-01', 'HIDDEN'),
        plate(p.bob, u.bob, 'Bob Plate', 5, '2026-02-02'),
        plate(p.carol, u.carol, 'Carol Plate', 4, '2026-02-03'),
      ],
    });
  });

  afterAll(async () => {
    await prisma.platinum.deleteMany({ where: { userId: { in: Object.values(u) } } });
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

  it('feeds only published plates from followed hunters, newest first', async () => {
    const page = await data.getFollowingFeedPage({
      followerId: u.bob,
      currentUserId: u.bob,
    });
    expect(page.items.map((item) => item.platinum.id)).toEqual([
      p.aliceNew,
      p.aliceOld,
    ]);
    expect(page.items.every((item) => item.user.id === u.alice)).toBe(true);
  });

  it('paginates the follow feed', async () => {
    const first = await data.getFollowingFeedPage({
      followerId: u.bob,
      currentUserId: u.bob,
      limit: 1,
    });
    expect(first.hasMore).toBe(true);
    expect(first.items.map((item) => item.platinum.id)).toEqual([p.aliceNew]);

    const second = await data.getFollowingFeedPage({
      followerId: u.bob,
      currentUserId: u.bob,
      limit: 1,
      offset: 1,
    });
    expect(second.hasMore).toBe(false);
    expect(second.items.map((item) => item.platinum.id)).toEqual([p.aliceOld]);
  });

  it('builds the monthly circle ranking from followed hunters only', async () => {
    const ranking = await data.getFollowingMonthlyRanking(u.alice, 10, u.alice);
    expect(ranking.map((platinum) => platinum.id)).toEqual([p.bob, p.carol]);
    expect(ranking[0]!.monthlyVotes).toBe(5);

    const single = await data.getFollowingMonthlyRanking(u.bob, 10, u.bob);
    expect(single.map((platinum) => platinum.id)).toEqual([p.aliceNew]);
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
