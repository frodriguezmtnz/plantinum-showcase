import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  ShieldAlert,
  SearchCheck,
  CheckCircle2,
  Gavel,
  Flag,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { auth } from '@/auth';
import { countNotifications, listNotifications } from '@/lib/notifications';
import {
  NOTIFICATION_MAX_LIMIT,
  NOTIFICATION_PAGE_SIZE,
  QUEUE_KINDS,
  notificationFilterHref,
  notificationLoadMoreHref,
  parseNotificationLimit,
  resolveNotificationFilter,
  type NotificationFilter,
} from '@/lib/notification-filters';
import { isModerator } from '@/lib/roles';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { AppealPlatinumButton } from '@/components/shared/appeal-platinum-button';
import { MarkAllReadButton } from '@/components/shared/mark-all-read-button';
import { NotificationRowActions } from '@/components/shared/notification-row-actions';
import { ClearReadNotificationsButton } from '@/components/shared/clear-read-notifications-button';
import type { NotificationKind } from '@/generated/prisma/enums';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Notifications | Platinum Showcase',
  robots: { index: false, follow: false },
};

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  PLATE_HIDDEN: ShieldAlert,
  PLATE_UNDER_REVIEW: SearchCheck,
  APPEAL_RESOLVED: CheckCircle2,
  APPEAL_RECEIVED: Gavel,
  PLATE_FLAGGED: ShieldAlert,
  REPORT_RECEIVED: Flag,
  NEW_FOLLOWER: UserPlus,
};

const EMPTY_STATES: Record<
  NotificationFilter,
  { title: string; description: string }
> = {
  all: {
    title: 'Nothing here yet',
    description:
      'We will let you know when a moderator acts on one of your platinums.',
  },
  unread: {
    title: "You're all caught up",
    description: 'No unread notices right now.',
  },
  moderation: {
    title: 'Queue is clear',
    description: 'No reports, appeals or AI flags are waiting for the team.',
  },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; limit?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const { filter: rawFilter, limit: rawLimit } = await searchParams;
  const limit = parseNotificationLimit(rawLimit);
  const [canModerate, counts] = await Promise.all([
    isModerator(userId),
    countNotifications(userId),
  ]);
  const filter = resolveNotificationFilter(rawFilter, counts.unread);
  const notifications = await listNotifications(userId, filter, limit);
  const readCount = counts.all - counts.unread;
  const total =
    filter === 'all'
      ? counts.all
      : filter === 'unread'
        ? counts.unread
        : counts.moderation;
  const canLoadMore =
    notifications.length < total && limit < NOTIFICATION_MAX_LIMIT;

  const tabs: { value: NotificationFilter; label: string; count: number }[] = [
    { value: 'unread', label: 'Unread', count: counts.unread },
    { value: 'all', label: 'All', count: counts.all },
    ...(canModerate
      ? [
          {
            value: 'moderation' as const,
            label: 'Moderation',
            count: counts.moderation,
          },
        ]
      : []),
  ];

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-bold font-headline">Notifications</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {counts.unread > 0 && <MarkAllReadButton filter={filter} />}
          <ClearReadNotificationsButton count={readCount} />
        </div>
      </div>

      <nav
        aria-label="Notification filters"
        className="mb-6 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-full border border-border/70 bg-background/40 p-0.5 text-xs"
      >
        {tabs.map((tab) => {
          const active = filter === tab.value;
          return (
            <Link
              key={tab.value}
              href={notificationFilterHref(tab.value)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'tabular text-[10px]',
                  active ? 'opacity-80' : 'text-muted-foreground',
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={EMPTY_STATES[filter].title}
          description={
            filter === 'all' && canModerate
              ? 'Reports, appeals and AI flags will show up here as they arrive.'
              : EMPTY_STATES[filter].description
          }
        />
      ) : (
        <>
        <ul className="space-y-3">
          {notifications.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const isQueueItem = QUEUE_KINDS.includes(item.kind);
            return (
              <li
                key={item.id}
                className={`panel-solid flex gap-3 rounded-xl p-4 ${
                  item.readAt
                    ? ''
                    : 'ring-1 ring-badge-new-foreground/30'
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {!item.readAt && (
                      <span className="rounded-full bg-badge-new px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-badge-new-foreground">
                        New
                      </span>
                    )}
                  </div>
                  {item.body && (
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                  {!item.platinumId && item.linkUrl && (
                    <div className="mt-3">
                      <Button asChild size="sm" variant="outline">
                        <Link href={item.linkUrl}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          View profile
                        </Link>
                      </Button>
                    </div>
                  )}
                  {item.platinumId && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isQueueItem && canModerate ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/admin/reports">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Open moderation queue
                          </Link>
                        </Button>
                      ) : null}
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/platinum/${item.platinumId}`}>View platinum</Link>
                      </Button>
                      {item.kind === 'PLATE_HIDDEN' && (
                        <AppealPlatinumButton
                          platinumId={item.platinumId}
                          gameName={item.title.replace(/^“|” was taken down$/g, '')}
                          className="h-9"
                        />
                      )}
                    </div>
                  )}
                </div>
                <NotificationRowActions
                  id={item.id}
                  isRead={Boolean(item.readAt)}
                />
              </li>
            );
          })}
        </ul>
        {canLoadMore && (
          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline">
              <Link
                href={notificationLoadMoreHref(
                  filter,
                  limit + NOTIFICATION_PAGE_SIZE,
                )}
                scroll={false}
              >
                Load more
              </Link>
            </Button>
          </div>
        )}
        </>
      )}
    </div>
  );
}
