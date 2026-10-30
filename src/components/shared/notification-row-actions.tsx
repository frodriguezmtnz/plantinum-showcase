'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { deleteNotification, markOneNotificationRead } from '@/app/actions';
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_READ_EVENT,
} from '@/lib/notification-events';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteNotificationButton } from '@/components/shared/delete-notification-button';
import { MarkNotificationReadButton } from '@/components/shared/mark-notification-read-button';

export function NotificationRowActions({
  id,
  isRead,
}: {
  id: string;
  isRead: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function markRead() {
    startTransition(async () => {
      const result = await markOneNotificationRead(id);
      if (result.updated > 0) {
        window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
      }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteNotification(id);
      if (result.removed > 0) {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
        toast({
          title: 'Notification deleted',
          variant: 'success',
        });
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="hidden shrink-0 items-center gap-0.5 sm:flex">
        {!isRead && <MarkNotificationReadButton id={id} />}
        <DeleteNotificationButton id={id} />
      </div>

      <div className="shrink-0 sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Notification actions"
              title="Notification actions"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isRead && (
              <DropdownMenuItem onSelect={markRead} disabled={isPending}>
                <Check className="h-4 w-4" />
                Mark as read
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={remove}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete notification
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
