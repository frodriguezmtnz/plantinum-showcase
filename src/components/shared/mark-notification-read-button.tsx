'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { markOneNotificationRead } from '@/app/actions';
import { NOTIFICATIONS_READ_EVENT } from '@/lib/notification-events';
import { Button } from '@/components/ui/button';

export function MarkNotificationReadButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Mark notification as read"
      title="Mark as read"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await markOneNotificationRead(id);
          if (result.updated > 0) {
            window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
          }
          router.refresh();
        });
      }}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </Button>
  );
}
