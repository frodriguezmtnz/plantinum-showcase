'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/shared/auth-shell';
import { UsernameHint } from '@/components/shared/username-hint';
import { useAuth } from '@/hooks/use-auth';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from '@/lib/usernames';
import { completeOAuthProfile, type WelcomeState } from './actions';

const initialState: WelcomeState = {};

export function WelcomeForm({
  email,
  callbackUrl,
}: {
  email: string;
  callbackUrl: string;
}) {
  const [state, formAction, isPending] = useActionState(
    completeOAuthProfile,
    initialState,
  );
  const [username, setUsername] = useState('');
  const usernameStatus = useUsernameAvailability(username);
  const { refresh, logout } = useAuth();
  // Refreshing the session re-renders the provider, so guard against running
  // the post-onboarding navigation more than once.
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!state.redirectTo || navigatedRef.current) return;
    navigatedRef.current = true;
    const target = state.redirectTo;
    // `update()` can resolve with no session (next-auth swallows the failed
    // session request), which leaves the client copy of the session stale and
    // bounces `/` back to `/welcome`. A full page load re-reads the session
    // from the server, so the handle is always picked up. Keep the soft
    // refresh as a best-effort sync and surface silent failures.
    refresh()
      .then((session) => {
        if (!session) {
          console.warn(
            '[welcome] session refresh returned no data; using a full page load',
          );
        }
      })
      .catch((error) => {
        console.warn('[welcome] could not refresh the session', error);
      })
      .finally(() => window.location.assign(target));
  }, [state.redirectTo, refresh]);

  const blocked =
    usernameStatus.state === 'invalid' ||
    usernameStatus.state === 'reserved' ||
    usernameStatus.state === 'taken';

  return (
    <AuthShell
      title="Choose your username"
      description="One last step before you start showing off your platinums."
      error={state.error}
      footer={
        <button
          type="button"
          onClick={logout}
          className="underline underline-offset-4"
        >
          Use a different account
        </button>
      }
    >
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="trophy-hunter"
            required
            minLength={USERNAME_MIN_LENGTH}
            maxLength={USERNAME_MAX_LENGTH}
            autoComplete="username"
            autoFocus
            aria-describedby="username-hint"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <div id="username-hint" role="status" aria-live="polite">
            <UsernameHint status={usernameStatus} username={username.trim()} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Signed in as <strong className="text-foreground">{email}</strong>. You
          can change your handle later in Settings.
        </p>
        <Button type="submit" className="w-full" disabled={isPending || blocked}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </AuthShell>
  );
}
