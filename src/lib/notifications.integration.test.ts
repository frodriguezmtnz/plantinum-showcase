import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('notifications.ts — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let notifications: typeof import('@/lib/notifications');

  const stamp = Date.now();
  const u = {
    alice: `it-notif-${stamp}-alice`,
    bob: `it-notif-${stamp}-bob`,
  };
  const n: Record<'aliceOwn' | 'aliceWrong' | 'aliceIdem' | 'bobOwn', string> = {
    aliceOwn: '',
    aliceWrong: '',
    aliceIdem: '',
    bobOwn: '',
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    prisma = (await import('@/lib/prisma')).prisma;
    notifications = await import('@/lib/notifications');

    await prisma.user.createMany({
      data: [
        { id: u.alice, email: `it-notif-alice-${stamp}@test.local`, username: `it_notif_alice_${stamp}` },
        { id: u.bob, email: `it-notif-bob-${stamp}@test.local`, username: `it_notif_bob_${stamp}` },
      ],
    });

    const rows = await Promise.all([
      prisma.notification.create({
        data: { userId: u.alice, kind: 'NEW_FOLLOWER', title: 'Own notice' },
        select: { id: true },
      }),
      prisma.notification.create({
        data: { userId: u.alice, kind: 'NEW_FOLLOWER', title: 'Wrong user notice' },
        select: { id: true },
      }),
      prisma.notification.create({
        data: { userId: u.alice, kind: 'NEW_FOLLOWER', title: 'Idempotent notice' },
        select: { id: true },
      }),
      prisma.notification.create({
        data: { userId: u.bob, kind: 'NEW_FOLLOWER', title: 'Bob notice' },
        select: { id: true },
      }),
    ]);
    n.aliceOwn = rows[0]!.id;
    n.aliceWrong = rows[1]!.id;
    n.aliceIdem = rows[2]!.id;
    n.bobOwn = rows[3]!.id;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: { in: [u.alice, u.bob] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [u.alice, u.bob] } } });
    await prisma.$disconnect();
  });

  it('marks only the requested notice for its owner', async () => {
    expect(await notifications.markNotificationRead(u.alice, n.aliceOwn)).toBe(1);

    const rows = await prisma.notification.findMany({
      where: { id: { in: [n.aliceOwn, n.aliceWrong, n.bobOwn] } },
      select: { id: true, readAt: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row.readAt]));

    expect(byId.get(n.aliceOwn)).toBeInstanceOf(Date);
    expect(byId.get(n.aliceWrong)).toBeNull();
    expect(byId.get(n.bobOwn)).toBeNull();
  });

  it('does not let another user mark someone else’s notice', async () => {
    expect(await notifications.markNotificationRead(u.bob, n.aliceWrong)).toBe(0);

    const row = await prisma.notification.findUnique({
      where: { id: n.aliceWrong },
      select: { readAt: true },
    });
    expect(row?.readAt).toBeNull();
  });

  it('is idempotent and leaves readAt untouched on repeat', async () => {
    expect(await notifications.markNotificationRead(u.alice, n.aliceIdem)).toBe(1);
    const first = await prisma.notification.findUnique({
      where: { id: n.aliceIdem },
      select: { readAt: true },
    });

    expect(await notifications.markNotificationRead(u.alice, n.aliceIdem)).toBe(0);
    const second = await prisma.notification.findUnique({
      where: { id: n.aliceIdem },
      select: { readAt: true },
    });

    expect(second?.readAt).toEqual(first?.readAt);
  });
});
