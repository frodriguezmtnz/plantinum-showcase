'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { clearReadNotifications } from '@/app/actions';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notification-events';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export function ClearReadNotificationsButton({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function clear() {
    startTransition(async () => {
      const result = await clearReadNotifications();
      setOpen(false);

      if (result.removed > 0) {
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
        toast({
          title:
            result.removed === 1
              ? 'Read notification cleared'
              : `${result.removed} read notifications cleared`,
          variant: 'success',
        });
      }
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count === 0}
        >
          <Trash2 className="h-4 w-4" />
          Clear read
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem]">
        <AlertDialogHeader>
          <AlertDialogTitle>Clear read notifications?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the read notices from your bell. Unread notices stay,
            and the moderation queue at /admin/reports is not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={clear}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear read
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
