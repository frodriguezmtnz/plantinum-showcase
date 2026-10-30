'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { markAllNotificationsRead } from '@/app/actions';
import { NOTIFICATIONS_READ_EVENT } from '@/lib/notification-events';
import {
  notificationFilterHref,
  type NotificationFilter,
} from '@/lib/notification-filters';
import { Button } from '@/components/ui/button';

/** Marks every notice read, then tells the header bell to drop its badge. */
export function MarkAllReadButton({ filter }: { filter: NotificationFilter }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await markAllNotificationsRead();
            window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
            if (filter === 'unread') {
              router.replace(notificationFilterHref('all'));
            } else {
              router.refresh();
            }
          } catch {
            router.refresh();
          }
        });
      }}
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Marking…' : 'Mark all as read'}
    </Button>
  );
}
