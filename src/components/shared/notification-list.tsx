'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCircle2,
  Flag,
  Gavel,
  Loader2,
  SearchCheck,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { loadMoreNotifications } from '@/app/actions';
import {
  QUEUE_KINDS,
  type NotificationFilter,
} from '@/lib/notification-filters';
import type { NotificationView } from '@/lib/notifications';
import type { NotificationKind } from '@/generated/prisma/enums';
import { Button } from '@/components/ui/button';
import { AppealPlatinumButton } from '@/components/shared/appeal-platinum-button';
import { NotificationRowActions } from '@/components/shared/notification-row-actions';

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  PLATE_HIDDEN: ShieldAlert,
  PLATE_UNDER_REVIEW: SearchCheck,
  APPEAL_RESOLVED: CheckCircle2,
  APPEAL_RECEIVED: Gavel,
  PLATE_FLAGGED: ShieldAlert,
  REPORT_RECEIVED: Flag,
  NEW_FOLLOWER: UserPlus,
  FOLLOWED_PLATE: Trophy,
};

export function NotificationList({
  initialItems,
  initialCursor,
  filter,
  canModerate,
}: {
  initialItems: NotificationView[];
  initialCursor: string | null;
  filter: NotificationFilter;
  canModerate: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const previousInitial = useRef(initialItems);

  // A server refresh (mark read, bulk actions, delete) sends a new first page.
  // Merge it in without dropping the pages the user already appended.
  useEffect(() => {
    const previous = previousInitial.current;
    previousInitial.current = initialItems;

    setItems((current) => {
      const previousIds = new Set(previous.map((item) => item.id));
      const freshIds = new Set(initialItems.map((item) => item.id));
      const freshById = new Map(initialItems.map((item) => [item.id, item]));

      const kept = current
        .filter((item) => !previousIds.has(item.id) || freshIds.has(item.id))
        .map((item) => freshById.get(item.id) ?? item);
      const keptIds = new Set(kept.map((item) => item.id));

      return [
        ...initialItems.filter((item) => !keptIds.has(item.id)),
        ...kept,
      ];
    });
  }, [initialItems]);

  // If the row a cursor pointed at is gone, stop offering "Load more" rather
  // than asking the server for a page that no longer has an anchor.
  const activeCursor =
    cursor && items.some((item) => item.id === cursor) ? cursor : null;

  function loadMore() {
    if (!activeCursor) return;
    const requested = activeCursor;
    startTransition(async () => {
      const page = await loadMoreNotifications(filter, requested);
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !known.has(item.id))];
      });
      setCursor(page.nextCursor);
    });
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = KIND_ICON[item.kind];
          const isQueueItem = QUEUE_KINDS.includes(item.kind);
          return (
            <li
              key={item.id}
              className={`panel-solid flex gap-3 rounded-xl p-4 ${
                item.readAt ? '' : 'ring-1 ring-badge-new-foreground/30'
              }`}
            >
              <Icon
                className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                aria-hidden
              />
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
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
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
                      <Link href={`/platinum/${item.platinumId}`}>
                        View platinum
                      </Link>
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
      {activeCursor && (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadMore}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
