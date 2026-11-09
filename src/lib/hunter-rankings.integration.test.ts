import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCurrentPeriod, shiftPeriod } from '@/lib/period';

/**
 * Postgres integration suite for the monthly hunter board. Like the other
 * integration files it only runs when TEST_DATABASE_URL is set and uses a
 * per-run stamp so it never touches real rows.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('hunter-rankings.ts — Postgres integration', () => {
  let rankings: typeof import('@/lib/hunter-rankings');
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  const stamp = Date.now();
  const period = getCurrentPeriod();
  const previousPeriod = shiftPeriod(period, -1);

  const u = {
    alice: `it-hunter-${stamp}-alice`,
    bob: `it-hunter-${stamp}-bob`,
    carol: `it-hunter-${stamp}-carol`,
    dave: `it-hunter-${stamp}-dave`,
    erin: `it-hunter-${stamp}-erin`,
  };

  const p = {
    aliceA: `it-hunter-${stamp}-plate-alice-a`,
    aliceB: `it-hunter-${stamp}-plate-alice-b`,
    aliceHidden: `it-hunter-${stamp}-plate-alice-hidden`,
    bob: `it-hunter-${stamp}-plate-bob`,
    carol: `it-hunter-${stamp}-plate-carol`,
    carolStale: `it-hunter-${stamp}-plate-carol-stale`,
    dave: `it-hunter-${stamp}-plate-dave`,
  };

  const plate = (
    id: string,
    userId: string,
    monthlyVotes: number,
    votes: number,
    monthlyVotesMonth: string | null,
    moderationStatus: 'PUBLISHED' | 'HIDDEN' = 'PUBLISHED',
  ) => ({
    id,
    userId,
    gameName: `Hunter Board ${id}`,
    platform: 'PS5',
    hash: `hash-${id}`,
    imageUrl: `https://example.test/${id}.avif`,
    imageHint: 'test',
    width: 1600,
    height: 900,
    votes,
    monthlyVotes,
    monthlyVotesMonth,
    platinumDate: new Date('2026-02-01'),
    moderationStatus,
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    rankings = await import('@/lib/hunter-rankings');
    prisma = (await import('@/lib/prisma')).prisma;

    await prisma.user.createMany({
      data: [
        {
          id: u.alice,
          email: `it-hunter-alice-${stamp}@test.local`,
          username: `it_hunter_alice_${stamp}`,
        },
        {
          id: u.bob,
          email: `it-hunter-bob-${stamp}@test.local`,
          username: `it_hunter_bob_${stamp}`,
        },
        {
          id: u.carol,
          email: `it-hunter-carol-${stamp}@test.local`,
          username: `it_hunter_carol_${stamp}`,
        },
        {
          id: u.dave,
          email: `it-hunter-dave-${stamp}@test.local`,
          username: `it_hunter_dave_${stamp}`,
        },
        {
          id: u.erin,
          email: `it-hunter-erin-${stamp}@test.local`,
          username: `it_hunter_erin_${stamp}`,
        },
      ],
    });

    await prisma.follow.createMany({
      data: [
        { followerId: u.dave, followingId: u.alice },
        { followerId: u.dave, followingId: u.bob },
      ],
    });

    await prisma.platinum.createMany({
      data: [
        // Alice: two voted plates this month (5 + 4) and a hidden plate that
        // must never leak into the board.
        plate(p.aliceA, u.alice, 5, 7, period),
        plate(p.aliceB, u.alice, 4, 6, period),
        plate(p.aliceHidden, u.alice, 100, 100, period, 'HIDDEN'),
        // Bob and Carol tie on monthly and all-time votes; the user id breaks
        // the tie deterministically (bob < carol).
        plate(p.bob, u.bob, 9, 9, period),
        plate(p.carol, u.carol, 9, 9, period),
        // Carol also has a big plate from a closed month: it must not count.
        plate(p.carolStale, u.carol, 50, 50, previousPeriod),
        // Dave (the viewer) holds a smaller monthly tally.
        plate(p.dave, u.dave, 3, 3, period),
      ],
    });
  });

  afterAll(async () => {
    await prisma.platinum.deleteMany({
      where: { userId: { in: Object.values(u) } },
    });
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

  it('sums monthly votes per hunter, ignoring hidden and stale plates', async () => {
    const board = await rankings.getHunterLeaderboard({ limit: 10 });

    expect(board.total).toBe(4);
    expect(board.items.map((item) => item.userId)).toEqual([
      u.alice,
      u.bob,
      u.carol,
      u.dave,
    ]);
    expect(board.items[0]).toMatchObject({
      userId: u.alice,
      monthlyVotes: 9,
      totalVotes: 13,
      plates: 2,
      rank: 1,
    });
    // Carol's stale plate does not inflate her current tally.
    expect(board.items.find((item) => item.userId === u.carol)).toMatchObject({
      monthlyVotes: 9,
      totalVotes: 9,
      plates: 1,
    });
  });

  it('breaks exact ties by user id so the order is deterministic', async () => {
    const first = await rankings.getHunterLeaderboard({ limit: 10 });
    const second = await rankings.getHunterLeaderboard({ limit: 10 });
    expect(second.items.map((item) => item.userId)).toEqual(
      first.items.map((item) => item.userId),
    );

    const bob = first.items.find((item) => item.userId === u.bob)!;
    const carol = first.items.find((item) => item.userId === u.carol)!;
    expect(bob.rank).toBe(2);
    expect(carol.rank).toBe(3);
  });

  it('paginates the board without duplicates', async () => {
    const first = await rankings.getHunterLeaderboard({ limit: 2 });
    expect(first.hasMore).toBe(true);
    expect(first.items.map((item) => item.userId)).toEqual([u.alice, u.bob]);

    const second = await rankings.getHunterLeaderboard({ offset: 2, limit: 2 });
    expect(second.hasMore).toBe(false);
    expect(second.items.map((item) => item.userId)).toEqual([u.carol, u.dave]);
  });

  it('scopes the board to the hunters the viewer follows', async () => {
    const circle = await rankings.getHunterLeaderboard({
      scope: 'circle',
      viewerId: u.dave,
      limit: 10,
    });
    expect(circle.total).toBe(2);
    expect(circle.items.map((item) => item.userId)).toEqual([u.alice, u.bob]);

    const noViewer = await rankings.getHunterLeaderboard({
      scope: 'circle',
      limit: 10,
    });
    expect(noViewer).toEqual({ items: [], total: 0, hasMore: false });
  });

  it('reports the viewer standing and null when they have no votes', async () => {
    const standing = await rankings.getViewerHunterStanding(u.dave);
    expect(standing).toEqual({
      rank: 4,
      total: 4,
      monthlyVotes: 3,
      plates: 1,
    });

    expect(await rankings.getViewerHunterStanding(u.erin)).toBeNull();
  });
});
