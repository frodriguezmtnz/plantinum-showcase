'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteNotification } from '@/app/actions';
import { NOTIFICATIONS_CHANGED_EVENT } from '@/lib/notification-events';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function DeleteNotificationButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Delete notification"
      title="Delete notification"
      disabled={isPending}
      onClick={() => {
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
      }}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
