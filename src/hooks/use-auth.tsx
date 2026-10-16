'use client';

import { useSession, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status, update } = useSession();

  const logout = () => signOut({ callbackUrl: '/' });

  return {
    user: session?.user ?? null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    // Re-reads the session on the client. Sign-in happens through a server
    // action, so the provider cache has to be refreshed by hand afterwards.
    refresh: update,
    logout,
  };
}