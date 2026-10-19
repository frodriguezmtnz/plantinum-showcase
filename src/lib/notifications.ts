import { prisma } from '@/lib/prisma';
import type { NotificationKind } from '@/generated/prisma/enums';

export interface NotificationView {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  platinumId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  platinumId?: string | null;
}

/** Best-effort owner notice; never breaks the moderation action that raised it. */
export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        platinumId: input.platinumId ?? null,
      },
    });
  } catch (error) {
    console.warn('[notifications] could not store notice', error);
  }
}

/**
 * Fans a queue notice out to every moderator and admin, so the in-app bell
 * mirrors what the Telegram chat already reports. Best-effort on purpose.
 */
export async function notifyModerators(
  input: Omit<NotifyInput, 'userId'>,
): Promise<void> {
  try {
    const moderators = await prisma.user.findMany({
      where: { role: { in: ['MODERATOR', 'ADMIN'] } },
      select: { id: true },
    });
    if (moderators.length === 0) return;

    await prisma.notification.createMany({
      data: moderators.map((moderator) => ({
        userId: moderator.id,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        platinumId: input.platinumId ?? null,
      })),
    });
  } catch (error) {
    console.warn('[notifications] could not store moderator notices', error);
  }
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<NotificationView[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    platinumId: row.platinumId,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
