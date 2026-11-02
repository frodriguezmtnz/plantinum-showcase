import { prisma } from '@/lib/prisma';
import {
  NOTIFICATION_PAGE_SIZE,
  QUEUE_KINDS,
  type NotificationCounts,
  type NotificationFilter,
} from '@/lib/notification-filters';
import type { NotificationKind } from '@/generated/prisma/enums';

export interface NotificationView {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  platinumId: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationView[];
  /** Id of the last row when another page exists; null at the end. */
  nextCursor: string | null;
}

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  platinumId?: string | null;
  linkUrl?: string | null;
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
        linkUrl: input.linkUrl ?? null,
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
        linkUrl: input.linkUrl ?? null,
      })),
    });
  } catch (error) {
    console.warn('[notifications] could not store moderator notices', error);
  }
}

function toNotificationView(row: {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  platinumId: string | null;
  linkUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationView {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    platinumId: row.platinumId,
    linkUrl: row.linkUrl,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ListNotificationsOptions {
  /** Id of the last row from the previous page. */
  cursor?: string | null;
  take?: number;
}

/**
 * One page of an owner's notices. Ordering is (createdAt desc, id desc) so the
 * cursor is stable when several notices share a timestamp; the extra row tells
 * whether another page exists without a second count query.
 */
export async function listNotifications(
  userId: string,
  filter: NotificationFilter = 'all',
  { cursor, take = NOTIFICATION_PAGE_SIZE }: ListNotificationsOptions = {},
): Promise<NotificationPage> {
  const rows = await prisma.notification.findMany({
    where: {
      userId,
      ...(filter === 'unread' ? { readAt: null } : {}),
      ...(filter === 'moderation' ? { kind: { in: QUEUE_KINDS } } : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > take;
  const visible = hasMore ? rows.slice(0, take) : rows;
  const last = visible[visible.length - 1];

  return {
    items: visible.map(toNotificationView),
    nextCursor: hasMore && last ? last.id : null,
  };
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** Counts for the filter pills; the page also derives the "clear read" total. */
export async function countNotifications(
  userId: string,
): Promise<NotificationCounts> {
  const [all, unread, moderation] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.count({ where: { userId, kind: { in: QUEUE_KINDS } } }),
  ]);
  return { all, unread, moderation };
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

/** A follower only gets one unread "new plate" notice per hunter per window. */
export const FOLLOW_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;
const FOLLOWER_CHUNK = 500;

/**
 * Fans a published plate out to the author's followers. Best-effort: a failed
 * notice never undoes the publication. Notices from the same hunter inside the
 * window are batched into one unread row instead of stacking.
 */
export async function notifyFollowersAboutPublishedPlate(
  platinumId: string,
): Promise<void> {
  try {
    const plate = await prisma.platinum.findUnique({
      where: { id: platinumId },
      select: {
        id: true,
        gameName: true,
        isSpoiler: true,
        userId: true,
        user: { select: { username: true } },
      },
    });
    if (!plate?.user.username) return;

    const authorUsername = plate.user.username;
    const profileUrl = `/u/${authorUsername}`;
    const since = new Date(Date.now() - FOLLOW_ACTIVITY_WINDOW_MS);

    const followers = await prisma.follow.findMany({
      where: {
        followingId: plate.userId,
        follower: { notifyFollowedUploads: true },
      },
      select: { followerId: true },
    });
    if (followers.length === 0) return;

    const followerIds = followers.map((row) => row.followerId);
    const pending = await prisma.notification.findMany({
      where: {
        userId: { in: followerIds },
        kind: 'FOLLOWED_PLATE',
        linkUrl: profileUrl,
        readAt: null,
        createdAt: { gte: since },
      },
      select: { userId: true },
    });
    const pendingIds = new Set(pending.map((row) => row.userId));
    const recipients = followerIds.filter((id) => !pendingIds.has(id));

    const recent = await prisma.platinum.count({
      where: {
        userId: plate.userId,
        moderationStatus: 'PUBLISHED',
        createdAt: { gte: since },
      },
    });

    const title =
      recent > 1
        ? `@${authorUsername} posted ${recent} new platinums`
        : `@${authorUsername} posted a new platinum`;
    const body = plate.isSpoiler
      ? 'Open their profile to reveal it when you are ready.'
      : recent > 1
        ? 'Open their profile to see the new additions.'
        : `“${plate.gameName}” just joined their shelf.`;

    if (pending.length > 0) {
      // Resurface the batched row so it shows up as the newest unread notice.
      await prisma.notification.updateMany({
        where: {
          userId: { in: [...pendingIds] },
          kind: 'FOLLOWED_PLATE',
          linkUrl: profileUrl,
          readAt: null,
        },
        data: {
          title,
          body,
          platinumId: null,
          createdAt: new Date(),
        },
      });
    }

    for (let index = 0; index < recipients.length; index += FOLLOWER_CHUNK) {
      const chunk = recipients.slice(index, index + FOLLOWER_CHUNK);
      await prisma.notification.createMany({
        data: chunk.map((userId) => ({
          userId,
          kind: 'FOLLOWED_PLATE' as const,
          title,
          body,
          platinumId: plate.id,
          linkUrl: profileUrl,
        })),
      });
    }
  } catch (error) {
    console.warn('[notifications] could not notify followers', error);
  }
}
