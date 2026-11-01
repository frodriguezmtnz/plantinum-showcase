import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Postgres integration suite for the "a hunter you follow posted a platinum"
 * notices: fan-out, per-user opt-out and the 24h batching window.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('notifications.ts — follow activity', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let notifications: typeof import('@/lib/notifications');
  let moderation: typeof import('@/lib/moderation-core');

  const stamp = Date.now();
  const u = {
    author: `it-activity-${stamp}-author`,
    on: `it-activity-${stamp}-on`,
    off: `it-activity-${stamp}-off`,
    stranger: `it-activity-${stamp}-stranger`,
  };
  const plateIds = {
    first: `it-activity-${stamp}-plate-first`,
    second: `it-activity-${stamp}-plate-second`,
    hidden: `it-activity-${stamp}-plate-hidden`,
    review: `it-activity-${stamp}-plate-review`,
  };

  const plate = (
    id: string,
    moderationStatus: 'PUBLISHED' | 'HIDDEN' | 'UNDER_REVIEW',
    gameName: string,
  ) => ({
    id,
    userId: u.author,
    gameName,
    platform: 'PS5',
    hash: `hash-${id}`,
    imageUrl: `https://example.test/${id}.avif`,
    imageHint: 'test',
    width: 1600,
    height: 900,
    votes: 0,
    monthlyVotes: 0,
    platinumDate: new Date('2026-01-01'),
    moderationStatus,
  });

  const activityNotices = (userId: string) =>
    prisma.notification.findMany({
      where: { userId, kind: 'FOLLOWED_PLATE' },
      orderBy: { createdAt: 'desc' },
    });

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    prisma = (await import('@/lib/prisma')).prisma;
    notifications = await import('@/lib/notifications');
    moderation = await import('@/lib/moderation-core');

    await prisma.user.createMany({
      data: [
        { id: u.author, email: `it-activity-author-${stamp}@test.local`, username: `it_activity_author_${stamp}` },
        { id: u.on, email: `it-activity-on-${stamp}@test.local`, username: `it_activity_on_${stamp}` },
        { id: u.off, email: `it-activity-off-${stamp}@test.local`, username: `it_activity_off_${stamp}`, notifyFollowedUploads: false },
        { id: u.stranger, email: `it-activity-stranger-${stamp}@test.local`, username: `it_activity_stranger_${stamp}` },
      ],
    });

    await prisma.follow.createMany({
      data: [
        { followerId: u.on, followingId: u.author },
        { followerId: u.off, followingId: u.author },
      ],
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: { in: Object.values(u) } },
    });
    await prisma.platinum.deleteMany({ where: { userId: u.author } });
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

  it('notifies only opted-in followers', async () => {
    await prisma.platinum.create({
      data: plate(plateIds.first, 'PUBLISHED', 'First Plate'),
    });
    await notifications.notifyFollowersAboutPublishedPlate(plateIds.first);

    const on = await activityNotices(u.on);
    expect(on).toHaveLength(1);
    expect(on[0]!.platinumId).toBe(plateIds.first);
    expect(on[0]!.title).toContain('posted a new platinum');
    expect(on[0]!.body).toContain('First Plate');

    expect(await activityNotices(u.off)).toHaveLength(0);
    expect(await activityNotices(u.stranger)).toHaveLength(0);
  });

  it('batches a second plate inside 24h into the same unread notice', async () => {
    await prisma.platinum.create({
      data: plate(plateIds.second, 'PUBLISHED', 'Second Plate'),
    });
    await notifications.notifyFollowersAboutPublishedPlate(plateIds.second);

    const on = await activityNotices(u.on);
    expect(on).toHaveLength(1);
    expect(on[0]!.platinumId).toBeNull();
    expect(on[0]!.linkUrl).toBe(`/u/it_activity_author_${stamp}`);
    expect(on[0]!.title).toContain('2 new platinums');
  });

  it('starts a fresh notice once the batched one is read', async () => {
    await prisma.notification.updateMany({
      where: { userId: u.on, kind: 'FOLLOWED_PLATE' },
      data: { readAt: new Date() },
    });

    const third = `it-activity-${stamp}-plate-third`;
    await prisma.platinum.create({
      data: plate(third, 'PUBLISHED', 'Third Plate'),
    });
    await notifications.notifyFollowersAboutPublishedPlate(third);

    const on = await activityNotices(u.on);
    expect(on).toHaveLength(2);
    expect(on[0]!.platinumId).toBe(third);
  });

  it('does not ping followers when a hidden plate is restored', async () => {
    await prisma.notification.updateMany({
      where: { userId: u.on, kind: 'FOLLOWED_PLATE' },
      data: { readAt: new Date() },
    });
    const before = (await activityNotices(u.on)).length;

    await prisma.platinum.create({
      data: plate(plateIds.hidden, 'HIDDEN', 'Hidden Plate'),
    });
    await moderation.applyPlatinumModeration(plateIds.hidden, 'PUBLISHED');

    expect((await activityNotices(u.on)).length).toBe(before);
  });

  it('pings followers when a moderator approves an under-review plate', async () => {
    await prisma.platinum.create({
      data: plate(plateIds.review, 'UNDER_REVIEW', 'Review Plate'),
    });
    await moderation.applyPlatinumModeration(plateIds.review, 'PUBLISHED');

    const on = await activityNotices(u.on);
    const notice = on.find((row) => row.platinumId === plateIds.review);
    expect(notice).toBeDefined();
    expect(notice!.title).toContain('posted');
  });
});
