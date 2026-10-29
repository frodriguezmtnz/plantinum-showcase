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

export interface NotificationCounts {
  all: number;
  unread: number;
  moderation: number;
}

/** "All" lives on the bare URL; the other filters are linkable/searchable. */
export function notificationFilterHref(filter: NotificationFilter): string {
  return filter === 'all' ? '/notifications' : `/notifications?filter=${filter}`;
}
