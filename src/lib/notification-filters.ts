import type { NotificationKind } from '@/generated/prisma/enums';

/** Who a notice belongs to: the owner's own notices or the moderation queue. */
export type NotificationFilter = 'all' | 'unread' | 'moderation';

/** Kinds that belong to the moderator queue rather than to a plate's owner. */
export const QUEUE_KINDS: NotificationKind[] = [
  'APPEAL_RECEIVED',
  'PLATE_FLAGGED',
  'REPORT_RECEIVED',
];

export function parseNotificationFilter(
  value: string | undefined,
): NotificationFilter {
  return value === 'unread' || value === 'moderation' ? value : 'all';
}

/** The bare inbox opens on Unread while there is anything waiting. */
export function resolveNotificationFilter(
  value: string | undefined,
  unreadCount: number,
): NotificationFilter {
  if (value) return parseNotificationFilter(value);
  return unreadCount > 0 ? 'unread' : 'all';
}

export interface NotificationCounts {
  all: number;
  unread: number;
  moderation: number;
}

export const NOTIFICATION_PAGE_SIZE = 30;

/** Every tab is explicit so "All" survives the unread-first default. */
export function notificationFilterHref(filter: NotificationFilter): string {
  return `/notifications?filter=${filter}`;
}
