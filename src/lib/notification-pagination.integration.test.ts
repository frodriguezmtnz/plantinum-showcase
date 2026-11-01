import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Postgres integration suite for cursor pagination. Runs only when
 * TEST_DATABASE_URL is set (CI), with per-run rows cleaned up afterwards.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('notifications.ts — cursor pagination', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let notifications: typeof import('@/lib/notifications');

  const stamp = Date.now();
  const owner = `it-page-${stamp}-owner`;
  const other = `it-page-${stamp}-other`;
  const base = new Date(Date.UTC(2026, 0, 1, 12, 0, 0)).getTime();

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    prisma = (await import('@/lib/prisma')).prisma;
    notifications = await import('@/lib/notifications');

    await prisma.user.createMany({
      data: [
        { id: owner, email: `it-page-owner-${stamp}@test.local`, username: `it_page_owner_${stamp}` },
        { id: other, email: `it-page-other-${stamp}@test.local`, username: `it_page_other_${stamp}` },
      ],
    });

    await prisma.notification.createMany({
      data: Array.from({ length: 35 }, (_, index) => ({
        userId: owner,
        kind: 'NEW_FOLLOWER' as const,
        title: `notice-${index}`,
        // Rows 28-30 share a timestamp so the page boundary falls inside a tie.
        createdAt: new Date(base + (index >= 28 && index <= 30 ? 28 : index) * 1000),
      })),
    });

    await prisma.notification.create({
      data: {
        userId: other,
        kind: 'NEW_FOLLOWER',
        title: 'other-user-notice',
        createdAt: new Date(base),
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { userId: { in: [owner, other] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [owner, other] } } });
    await prisma.$disconnect();
  });

  it('pages newest first without duplicates or gaps across a tie', async () => {
    const first = await notifications.listNotifications(owner, 'all');
    expect(first.items).toHaveLength(30);
    expect(first.nextCursor).toBe(first.items[29]!.id);

    const second = await notifications.listNotifications(owner, 'all', {
      cursor: first.nextCursor,
    });
    expect(second.items).toHaveLength(5);
    expect(second.nextCursor).toBeNull();

    const ids = [...first.items, ...second.items].map((item) => item.id);
    expect(new Set(ids).size).toBe(35);

    for (let index = 1; index < first.items.length; index += 1) {
      const previous = new Date(first.items[index - 1]!.createdAt).getTime();
      const current = new Date(first.items[index]!.createdAt).getTime();
      expect(previous).toBeGreaterThanOrEqual(current);
    }
  });

  it('honours the unread filter while paginating', async () => {
    await prisma.notification.updateMany({
      where: {
        userId: owner,
        title: { in: ['notice-0', 'notice-1', 'notice-2', 'notice-3', 'notice-4'] },
      },
      data: { readAt: new Date() },
    });

    const first = await notifications.listNotifications(owner, 'unread', {
      take: 20,
    });
    expect(first.items).toHaveLength(20);
    expect(first.items.every((item) => item.readAt === null)).toBe(true);
    expect(first.nextCursor).not.toBeNull();

    const second = await notifications.listNotifications(owner, 'unread', {
      take: 20,
      cursor: first.nextCursor,
    });
    expect(second.items).toHaveLength(10);
    expect(second.items.every((item) => item.readAt === null)).toBe(true);
    expect(second.nextCursor).toBeNull();
  });

  it('never leaks notices from another owner', async () => {
    const page = await notifications.listNotifications(owner, 'all');
    expect(page.items.some((item) => item.title === 'other-user-notice')).toBe(
      false,
    );
  });
});
