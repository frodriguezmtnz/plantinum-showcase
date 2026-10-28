'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status, update } = useSession();

  // The provider rebuilds `update` on every re-render (its context value is a
  // useMemo keyed on session/loading), so its identity is not stable. Effects
  // that listed it as a dependency re-ran after each sign-in and called it
  // again, producing an endless refresh loop. Expose a stable wrapper and
  // always forward to the latest `update`.
  const updateRef = useRef(update);
  useEffect(() => {
    updateRef.current = update;
  });
  // Passing an object makes next-auth POST to /api/auth/session, which is the
  // only call that runs the jwt callback with trigger: "update". Without it,
  // Settings changes (handle, avatar) would stay stale until a full re-login.
  const refresh = useCallback(() => updateRef.current({}), []);

  const logout = useCallback(() => signOut({ callbackUrl: '/' }), []);

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    // Re-reads the session on the client. Sign-in happens through a server
    // action, so the provider cache has to be refreshed by hand afterwards.
    refresh,
    logout,
  };
}
