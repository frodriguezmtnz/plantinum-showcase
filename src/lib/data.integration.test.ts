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
  };
  const period = getCurrentPeriod();

  const platinum = (
    id: string,
    userId: string,
    gameName: string,
    platform: string,
    votes: number,
    monthlyVotes: number,
    monthlyVotesMonth: string | null,
    platinumDate: string,
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
  });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    data = await import('@/lib/data');
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
      ],
    });
    await prisma.vote.createMany({
      data: [
        { userId: u.bob, platinumId: p.a, period },
        { userId: u.alice, platinumId: p.b, period },
      ],
    });
  });

  afterAll(async () => {
    await prisma.vote.deleteMany({ where: { platinumId: { in: Object.values(p) } } });
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
    expect(page2.hasMore).toBe(false);
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
});
