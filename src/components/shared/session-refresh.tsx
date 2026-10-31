'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SESSION_REFRESH_CHANNEL } from '@/lib/session-events';

const MIN_REFRESH_MS = 30_000;

/** Re-reads the JWT after focus or another tab announces an identity change. */
export function SessionRefresh() {
  const router = useRouter();
  const { status, update } = useSession();
  const updateRef = useRef(update);
  const inFlight = useRef(false);
  const pendingForce = useRef(false);
  const refreshRef = useRef<(force: boolean) => void>(() => {});
  const lastRefresh = useRef(0);

  useEffect(() => {
    updateRef.current = update;
  });

  const refresh = useCallback(
    (force: boolean) => {
      if (status !== 'authenticated') return;

      if (inFlight.current) {
        // A broadcast must not be lost because a routine focus refresh is
        // already running; replay it once that one settles.
        if (force) pendingForce.current = true;
        return;
      }

      const now = Date.now();
      if (!force && now - lastRefresh.current < MIN_REFRESH_MS) return;

      lastRefresh.current = now;
      inFlight.current = true;
      void updateRef
        .current({})
        .catch(() => undefined)
        .finally(() => {
          inFlight.current = false;
          // The session cookie is fresh now, so re-run the server components:
          // props read at render time (avatar, bio, plan) would otherwise stay
          // frozen until a full reload. Only on a broadcast — a routine focus
          // refresh should not refetch the page tree.
          if (force) router.refresh();
          if (pendingForce.current) {
            pendingForce.current = false;
            refreshRef.current(true);
          }
        });
    },
    [router, status],
  );

  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    if (status !== 'authenticated') return;
    lastRefresh.current = Date.now();

    const onFocus = () => refresh(false);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh(false);
    };
    const onBroadcast = () => refresh(true);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(SESSION_REFRESH_CHANNEL);
      channel.onmessage = onBroadcast;
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      channel?.close();
    };
  }, [refresh, status]);

  return null;
}
