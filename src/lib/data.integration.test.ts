import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCurrentPeriod } from '@/lib/period';

/**
 * Postgres integration suite for the data layer. It only runs when
 * TEST_DATABASE_URL is set (CI points it at the service DB after
 * `prisma migrate deploy`), so local `pnpm test` stays green without a DB.
 * Rows are prefixed with a per-run stamp and cleaned up in afterAll.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('data.ts — Postgres integration', () => {
  let data: typeof import('@/lib/data');
  let history: typeof import('@/lib/history');
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  const stamp = Date.now();
  const u = {
    alice: `it-${stamp}-alice`,
    bob: `it-${stamp}-bob`,
    carol: `it-${stamp}-carol`,
  };
  const p = {
    a: `it-${stamp}-plate-a`,
    b: `it-${stamp}-plate-b`,
    c: `it-${stamp}-plate-c`,
    d: `it-${stamp}-plate-d`,
    e: `it-${stamp}-plate-e`,
    f: `it-${stamp}-plate-f`, // hidden (moderation)
  };
  const period = getCurrentPeriod();
  // A far-past, test-only period: never collides with real history and is
  // always behind the current Madrid month, so it is a closed race.
  const closedPeriod = '2020-01';

  const platinum = (
    id: string,
    userId: string,
    gameName: string,
    platform: string,
    votes: number,
    monthlyVotes: number,
    monthlyVotesMonth: string | null,
    platinumDate: string,
    createdAt?: string,
  ) => ({
    id,
    userId,
    gameName,
    platform,
    hash: `hash-${id}`,
    imageUrl: `https://example.test/${id}.avif`,
    imageHint: 'test',
    width: 1600,
    height: 900,
    votes,
    monthlyVotes,
    monthlyVotesMonth,
    platinumDate: new Date(platinumDate),
    createdAt: createdAt ? new Date(createdAt) : new Date(platinumDate),
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    data = await import('@/lib/data');
    history = await import('@/lib/history');
    prisma = (await import('@/lib/prisma')).prisma;

    await prisma.user.createMany({
      data: [
        { id: u.alice, email: `it-alice-${stamp}@test.local`, username: `it_alice_${stamp}` },
        { id: u.bob, email: `it-bob-${stamp}@test.local`, username: `it_bob_${stamp}` },
        { id: u.carol, email: `it-carol-${stamp}@test.local`, username: `it_carol_${stamp}` },
      ],
    });
    await prisma.platinum.createMany({
      data: [
        platinum(p.a, u.alice, 'Bloodborne Integration', 'PS4', 7, 5, period, '2026-01-01'),
        platinum(p.b, u.bob, 'Cyberpunk Integration', 'PS5', 4, 3, period, '2026-02-01'),
        platinum(p.c, u.carol, 'Ghost of Yotei Integration', 'PS5', 120, 99, '2020-01', '2026-03-01'),
        platinum(p.d, u.alice, 'Astro Bot Integration', 'PS5', 0, 0, null, '2026-04-01'),
        platinum(p.e, u.alice, 'Hollow Knight Integration', 'PC', 0, 0, null, '2020-01-01', new Date().toISOString()),
        {
          ...platinum(p.f, u.alice, 'Hidden Integration', 'PS5', 9, 9, period, '2026-05-01'),
          moderationStatus: 'HIDDEN',
        },
      ],
    });
    await prisma.vote.createMany({
      data: [
        { userId: u.bob, platinumId: p.a, period },
        { userId: u.alice, platinumId: p.b, period },
        // A closed month: p.c wins with 2 votes, p.a and p.b tie at 1.
        { userId: u.alice, platinumId: p.c, period: closedPeriod },
        { userId: u.bob, platinumId: p.c, period: closedPeriod },
        { userId: u.carol, platinumId: p.a, period: closedPeriod },
        { userId: u.carol, platinumId: p.b, period: closedPeriod },
      ],
    });
  });

  afterAll(async () => {
    await prisma.report.deleteMany({ where: { platinumId: { in: Object.values(p) } } });
    await prisma.vote.deleteMany({ where: { platinumId: { in: Object.values(p) } } });
    // Snapshots have no FK, so the frozen rows for the test period are cleared
    // explicitly — this runs only against the dedicated test database.
    await prisma.monthlyResult.deleteMany({ where: { period: closedPeriod } });
    await prisma.platinum.deleteMany({ where: { id: { in: Object.values(p) } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(u) } } });
    await prisma.$disconnect();
  });

  it('ranks only the current period and by monthly votes', async () => {
    const ranked = await data.getMonthlyRanking(10);
    expect(ranked.map((x) => x.id)).toEqual([p.a, p.b]);
    expect(ranked[0]!.monthlyVotes).toBe(5);
  });

  it('flags the viewer\'s votes in the ranking', async () => {
    const ranked = await data.getMonthlyRanking(10, u.bob);
    expect(ranked.find((x) => x.id === p.a)?.hasVoted).toBe(true);
    expect(ranked.find((x) => x.id === p.b)?.hasVoted).toBe(false);
  });

  it('hides stale-period tallies behind zero monthly votes', async () => {
    const [view] = await data.getLatestPlatinums(100);
    const stale = (await data.getPlatinumsByUserId(u.carol))[0]!;
    expect(stale.monthlyVotes).toBe(0);
    expect(stale.votes).toBe(120);
    expect(view!.id).toBe(p.d);
  });

  it('keeps the hall of fame inside the current month', async () => {
    const fame = await data.getHallOfFame(3);
    expect(fame.map((x) => x.id)).toEqual([p.a, p.b]);
  });

  it('orders latest platinums by platinum date', async () => {
    const latest = await data.getLatestPlatinums(4);
    expect(latest.map((x) => x.id)).toEqual([p.d, p.c, p.b, p.a]);
  });

  it('paginates with hasMore and offset windows', async () => {
    const page1 = await data.getPlatinumsPage({ limit: 2 });
    expect(page1.items.map((x) => x.platinum.id)).toEqual([p.d, p.c]);
    expect(page1.hasMore).toBe(true);
    const page2 = await data.getPlatinumsPage({ limit: 2, offset: 2 });
    expect(page2.items.map((x) => x.platinum.id)).toEqual([p.b, p.a]);
    expect(page2.hasMore).toBe(true);
    const page3 = await data.getPlatinumsPage({ limit: 2, offset: 4 });
    expect(page3.items.map((x) => x.platinum.id)).toEqual([p.e]);
    expect(page3.hasMore).toBe(false);
  });

  it('attaches the owning user to each page item', async () => {
    const page = await data.getPlatinumsPage({ limit: 10 });
    const item = page.items.find((x) => x.platinum.id === p.a)!;
    expect(item.user.id).toBe(u.alice);
    expect(item.user.username).toBe(`it_alice_${stamp}`);
  });

  it('searches game names case-insensitively', async () => {
    const page = await data.getPlatinumsPage({ q: 'bloodborne' });
    expect(page.items.map((x) => x.platinum.id)).toEqual([p.a]);
  });

  it('filters by platform', async () => {
    const page = await data.getPlatinumsPage({ platform: 'PS4' });
    expect(page.items.map((x) => x.platinum.id)).toEqual([p.a]);
  });

  it('sorts by most-voted across all time', async () => {
    const page = await data.getPlatinumsPage({ sort: 'most-voted', limit: 4 });
    expect(page.items.map((x) => x.platinum.id)).toEqual([p.c, p.a, p.b, p.d]);
  });

  it('sums the monthly race board', async () => {
    const stats = await data.getMonthlyRaceStats();
    expect(stats).toEqual({ plates: 2, votes: 8 });
  });

  it('counts the community', async () => {
    const stats = await data.getCommunityStats();
    expect(stats.platinums).toBeGreaterThanOrEqual(4);
    expect(stats.votes).toBeGreaterThanOrEqual(131);
    expect(stats.hunters).toBeGreaterThanOrEqual(3);
    expect(stats.games).toBeGreaterThanOrEqual(4);
  });

  it('looks up a single platinum with viewer state', async () => {
    const asBob = await data.getPlatinumById(p.a, u.bob);
    expect(asBob?.hasVoted).toBe(true);
    const anon = await data.getPlatinumById(p.a);
    expect(anon?.hasVoted).toBe(false);
  });

  it('loads users by id without the whole table', async () => {
    const users = await data.getUsersByIds([u.alice, u.alice, u.bob]);
    expect(users.map((x) => x.id).sort()).toEqual([u.alice, u.bob].sort());
    expect(await data.getUsersByIds([])).toEqual([]);
  });

  it('resolves a user by username with their pride platinum', async () => {
    const alice = await data.getUserByUsername(`it_alice_${stamp}`);
    expect(alice?.id).toBe(u.alice);
    expect(alice?.pridePlatinumId).toBe(p.a);
  });

  it('counts uploads only inside the current period', async () => {
    expect(await data.countUploadsInCurrentPeriod(u.alice)).toBe(1);
    expect(await data.countUploadsInCurrentPeriod(u.bob)).toBe(0);
    expect(await data.countUploadsInCurrentPeriod(u.carol)).toBe(0);
  });

  it('reads the latest closed month from the live vote ledger', async () => {
    const closed = await history.getLatestClosedRanking(5);
    expect(closed?.period).toBe(closedPeriod);
    expect(closed?.entries.map((entry) => entry.id)).toEqual([p.c, p.a, p.b]);
    expect(closed?.entries[0]?.votes).toBe(2);
    expect(closed?.entries[0]?.username).toBe(`it_carol_${stamp}`);
  });

  it('freezes closed months idempotently', async () => {
    const created = await history.ensureSnapshots();
    expect(created).toBeGreaterThanOrEqual(3);
    expect(await history.ensureSnapshots()).toBe(0);

    const frozen = await history.getArchivedRanking(closedPeriod, 5);
    expect(frozen.entries.map((entry) => entry.id)).toEqual([p.c, p.a, p.b]);

    const latest = await history.getLatestClosedRanking(5);
    expect(latest?.period).toBe(closedPeriod);
    expect(latest?.entries[0]?.id).toBe(p.c);
  });

  it('fills from the all-time most-voted, spoiler-free pool', async () => {
    const top = await data.getMostVotedPlatinums(3);
    expect(top.map((x) => x.id)).toEqual([p.c, p.a, p.b]);

    const filled = await data.getMostVotedPlatinums(8, [p.c]);
    expect(filled.map((x) => x.id)).toEqual([p.a, p.b]);
  });

  it('keeps non-published plates out of every public list', async () => {
    const page = await data.getPlatinumsPage({ limit: 50 });
    expect(page.items.map((x) => x.platinum.id)).not.toContain(p.f);

    const latest = await data.getLatestPlatinums(50);
    expect(latest.map((x) => x.id)).not.toContain(p.f);

    const top = await data.getMostVotedPlatinums(50);
    expect(top.map((x) => x.id)).not.toContain(p.f);
  });

  it('shows an unpublished plate only to its owner or a moderator', async () => {
    expect(await data.getPlatinumById(p.f, u.bob)).toBeUndefined();
    expect((await data.getPlatinumById(p.f, u.alice))?.id).toBe(p.f);
    expect(
      (await data.getPlatinumById(p.f, u.bob, { includeUnpublished: true }))?.id,
    ).toBe(p.f);
  });

  it('hides unpublished plates from other profiles but not the owner shelf', async () => {
    const owner = await data.getPlatinumsByUserId(u.alice, u.alice);
    expect(owner.map((x) => x.id)).toContain(p.f);

    const visitor = await data.getPlatinumsByUserId(u.alice, u.bob);
    expect(visitor.map((x) => x.id)).not.toContain(p.f);
  });

  it('enforces one report per user per plate and lists open reports', async () => {
    await prisma.report.create({
      data: { platinumId: p.f, userId: u.bob, reason: 'SEXUAL', message: 'nope' },
    });

    await expect(
      prisma.report.create({
        data: { platinumId: p.f, userId: u.bob, reason: 'SPAM' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    const open = await data.getOpenReports();
    const mine = open.find((row) => row.platinumId === p.f);
    expect(mine?.reason).toBe('SEXUAL');
    expect(mine?.ownerUsername).toBe(`it_alice_${stamp}`);
    expect(mine?.reporterUsername).toBe(`it_bob_${stamp}`);
  });

  it('lists hidden plates with owner and report count', async () => {
    const hidden = await data.getHiddenPlatinums();
    const row = hidden.find((plate) => plate.id === p.f);
    expect(row?.ownerUsername).toBe(`it_alice_${stamp}`);
    expect(row?.reportCount).toBeGreaterThanOrEqual(1);
  });
});
