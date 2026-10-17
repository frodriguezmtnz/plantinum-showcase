'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/app/actions';
import { NOTIFICATIONS_READ_EVENT } from '@/lib/notification-events';
import { Button } from '@/components/ui/button';

/** Bell that links to the owner's notices and dots when something is unread. */
export function NotificationBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = () => {
      getUnreadNotificationCount()
        .then((count) => {
          if (alive) setUnread(count);
        })
        .catch(() => {
          // Notices are best-effort; a signed-out or offline visitor just sees 0.
        });
    };

    const handleRead = () => {
      // Clear the dot immediately instead of waiting for the next count fetch.
      setUnread(0);
      load();
    };

    load();
    window.addEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
    return () => {
      alive = false;
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
    };
  }, []);

  return (
    <Button
      asChild
      variant="ghost"
      className={`relative h-10 w-10 rounded-full ${className ?? ''}`}
    >
      <Link
        href="/notifications"
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : 'Notifications'
        }
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}
