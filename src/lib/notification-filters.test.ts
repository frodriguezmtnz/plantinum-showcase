import { describe, expect, it } from 'vitest';
import {
  notificationFilterHref,
  notificationLoadMoreHref,
  NOTIFICATION_MAX_LIMIT,
  NOTIFICATION_PAGE_SIZE,
  parseNotificationFilter,
  parseNotificationLimit,
  resolveNotificationFilter,
  QUEUE_KINDS,
} from '@/lib/notification-filters';

describe('parseNotificationFilter', () => {
  it('defaults to all for missing or unknown values', () => {
    expect(parseNotificationFilter(undefined)).toBe('all');
    expect(parseNotificationFilter('')).toBe('all');
    expect(parseNotificationFilter('archived')).toBe('all');
  });

  it('accepts the two linkable filters', () => {
    expect(parseNotificationFilter('unread')).toBe('unread');
    expect(parseNotificationFilter('moderation')).toBe('moderation');
  });
});

describe('resolveNotificationFilter', () => {
  it('opens the bare inbox on unread while there is anything waiting', () => {
    expect(resolveNotificationFilter(undefined, 1)).toBe('unread');
    expect(resolveNotificationFilter('', 3)).toBe('unread');
  });

  it('falls back to all when there are no unread notices', () => {
    expect(resolveNotificationFilter(undefined, 0)).toBe('all');
    expect(resolveNotificationFilter('', 0)).toBe('all');
  });

  it('honours an explicit filter even when unread notices exist', () => {
    expect(resolveNotificationFilter('all', 2)).toBe('all');
    expect(resolveNotificationFilter('moderation', 2)).toBe('moderation');
  });
});

describe('notificationFilterHref', () => {
  it('makes every filter explicit so All is always reachable', () => {
    expect(notificationFilterHref('all')).toBe('/notifications?filter=all');
    expect(notificationFilterHref('unread')).toBe('/notifications?filter=unread');
    expect(notificationFilterHref('moderation')).toBe(
      '/notifications?filter=moderation',
    );
  });
});

describe('parseNotificationLimit', () => {
  it('starts at one page and grows from there', () => {
    expect(parseNotificationLimit(undefined)).toBe(NOTIFICATION_PAGE_SIZE);
    expect(parseNotificationLimit('0')).toBe(NOTIFICATION_PAGE_SIZE);
    expect(parseNotificationLimit('60')).toBe(60);
  });

  it('caps runaway limits', () => {
    expect(parseNotificationLimit('9999')).toBe(NOTIFICATION_MAX_LIMIT);
  });
});

describe('notificationLoadMoreHref', () => {
  it('preserves the filter and the next limit', () => {
    expect(notificationLoadMoreHref('unread', 60)).toBe(
      '/notifications?filter=unread&limit=60',
    );
  });
});

describe('QUEUE_KINDS', () => {
  it('covers the moderation queue and nothing else', () => {
    expect(QUEUE_KINDS).toEqual([
      'APPEAL_RECEIVED',
      'PLATE_FLAGGED',
      'REPORT_RECEIVED',
    ]);
  });
});
