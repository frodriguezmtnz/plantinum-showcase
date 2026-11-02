import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { auth } from '@/auth';
import { countNotifications, listNotifications } from '@/lib/notifications';
import {
  notificationFilterHref,
  resolveNotificationFilter,
  type NotificationFilter,
} from '@/lib/notification-filters';
import { isModerator } from '@/lib/roles';
import { EmptyState } from '@/components/shared/empty-state';
import { MarkAllReadButton } from '@/components/shared/mark-all-read-button';
import { ClearReadNotificationsButton } from '@/components/shared/clear-read-notifications-button';
import { NotificationList } from '@/components/shared/notification-list';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Notifications | Platinum Showcase',
  robots: { index: false, follow: false },
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
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const { filter: rawFilter } = await searchParams;
  const [canModerate, counts] = await Promise.all([
    isModerator(userId),
    countNotifications(userId),
  ]);
  const filter = resolveNotificationFilter(rawFilter, counts.unread);
  const page = await listNotifications(userId, filter);
  const notifications = page.items;
  const readCount = counts.all - counts.unread;

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
        <NotificationList
          key={filter}
          initialItems={notifications}
          initialCursor={page.nextCursor}
          filter={filter}
          canModerate={canModerate}
        />
      )}
    </div>
  );
}
