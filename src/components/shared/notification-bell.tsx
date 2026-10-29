'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount } from '@/app/actions';
import {
  NOTIFICATIONS_CHANGED_EVENT,
  NOTIFICATIONS_READ_EVENT,
} from '@/lib/notification-events';
import { Button } from '@/components/ui/button';

/** How often the bell re-reads the unread count while the tab is visible. */
const POLL_MS = 60_000;

/** Bell that links to the owner's notices and dots when something is unread. */
export function NotificationBell({ className }: { className?: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    let inFlight = false;

    const load = () => {
      // Polling and the visibility handler can fire together; keep one request.
      if (inFlight) return;
      inFlight = true;
      getUnreadNotificationCount()
        .then((count) => {
          if (alive) setUnread(count);
        })
        .catch(() => {
          // Notices are best-effort; a signed-out or offline visitor just sees 0.
        })
        .finally(() => {
          inFlight = false;
        });
    };

    const handleRead = () => {
      // Clear the dot immediately instead of waiting for the next count fetch.
      setUnread(0);
      load();
    };

    const handleChanged = () => {
      load();
    };

    // Coming back from another tab is when new notices are most likely waiting.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };

    // Slow poll for notices that arrive while the user keeps this tab open.
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);

    load();
    window.addEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChanged);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleChanged);
      document.removeEventListener('visibilitychange', handleVisibility);
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
