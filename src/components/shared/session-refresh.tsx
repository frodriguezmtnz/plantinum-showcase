'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { SESSION_REFRESH_CHANNEL } from '@/lib/session-events';

const MIN_REFRESH_MS = 30_000;

/** Re-reads the JWT after focus or another tab announces an identity change. */
export function SessionRefresh() {
  const { status, update } = useSession();
  const updateRef = useRef(update);
  const inFlight = useRef(false);
  const lastRefresh = useRef(0);

  useEffect(() => {
    updateRef.current = update;
  });

  const refresh = useCallback(
    (force: boolean) => {
      if (status !== 'authenticated' || inFlight.current) return;

      const now = Date.now();
      if (!force && now - lastRefresh.current < MIN_REFRESH_MS) return;

      lastRefresh.current = now;
      inFlight.current = true;
      void updateRef
        .current({})
        .catch(() => undefined)
        .finally(() => {
          inFlight.current = false;
        });
    },
    [status],
  );

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
