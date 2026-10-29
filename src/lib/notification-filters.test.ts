import { describe, expect, it } from 'vitest';
import {
  notificationFilterHref,
  parseNotificationFilter,
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

describe('notificationFilterHref', () => {
  it('keeps "all" on the bare URL', () => {
    expect(notificationFilterHref('all')).toBe('/notifications');
    expect(notificationFilterHref('unread')).toBe('/notifications?filter=unread');
    expect(notificationFilterHref('moderation')).toBe(
      '/notifications?filter=moderation',
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
