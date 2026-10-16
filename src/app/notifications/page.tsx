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
} from 'lucide-react';
import { auth } from '@/auth';
import { listNotifications } from '@/lib/notifications';
import { isModerator } from '@/lib/roles';
import { markAllNotificationsRead } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { AppealPlatinumButton } from '@/components/shared/appeal-platinum-button';
import type { NotificationKind } from '@/generated/prisma/enums';

export const metadata = {
  title: 'Notifications | Platinum Showcase',
};

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  PLATE_HIDDEN: ShieldAlert,
  PLATE_UNDER_REVIEW: SearchCheck,
  APPEAL_RESOLVED: CheckCircle2,
  APPEAL_RECEIVED: Gavel,
  PLATE_FLAGGED: ShieldAlert,
  REPORT_RECEIVED: Flag,
};

/** Kinds that belong to the moderator queue rather than to a plate's owner. */
const QUEUE_KINDS: NotificationKind[] = [
  'APPEAL_RECEIVED',
  'PLATE_FLAGGED',
  'REPORT_RECEIVED',
];

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/login');

  const [notifications, canModerate] = await Promise.all([
    listNotifications(userId),
    isModerator(userId),
  ]);

  return (
    <div className="container max-w-2xl py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" aria-hidden />
          <h1 className="text-2xl font-bold font-headline">Notifications</h1>
        </div>
        {notifications.some((item) => !item.readAt) && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all as read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here yet"
          description={
            canModerate
              ? 'Reports, appeals and AI flags will show up here as they arrive.'
              : 'We will let you know when a moderator acts on one of your platinums.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((item) => {
            const Icon = KIND_ICON[item.kind];
            const isQueueItem = QUEUE_KINDS.includes(item.kind);
            return (
              <li
                key={item.id}
                className={`panel-solid flex gap-3 rounded-xl p-4 ${
                  item.readAt ? '' : 'ring-1 ring-primary/30'
                }`}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    {!item.readAt && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
