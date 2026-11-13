'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/shared/auth-shell';
import { AuthUtilityAside } from '@/components/shared/auth-utility-aside';
import { HandleSetupIllustration } from '@/components/shared/auth-illustrations';
import { UsernameHint } from '@/components/shared/username-hint';
import { useAuth } from '@/hooks/use-auth';
import { fireAccountReadyConfetti } from '@/lib/celebrate';
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
    // A freshly created handle gets a short success moment; the confetti is
    // fired right away so it plays while the screen is visible.
    const celebrating = Boolean(state.username);
    const delay = celebrating ? 1200 : 0;
    if (celebrating) void fireAccountReadyConfetti();

    let timer: number | undefined;
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
      .finally(() => {
        if (delay > 0) {
          timer = window.setTimeout(
            () => window.location.assign(target),
            delay,
          );
        } else {
          window.location.assign(target);
        }
      });

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [state.redirectTo, state.username, refresh]);

  if (state.redirectTo && state.username) {
    return (
      <AuthShell
        title="Welcome aboard."
        description="Your shelf is ready for its first platinum."
        aside={
          <AuthUtilityAside
            illustration={<HandleSetupIllustration />}
            title="You're in."
            description="One second and we will take you to the showcase."
            points={[
              `Your handle is live at /u/${state.username}.`,
              'Upload a platinum with its screenshot and the story behind it.',
              'Vote and follow to climb the monthly ranking.',
            ]}
          />
        }
      >
        <div className="space-y-4 text-center" role="status" aria-live="polite">
          <CheckCircle2 className="mx-auto h-12 w-12 text-live" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Welcome aboard,{' '}
            <strong className="text-foreground">@{state.username}</strong>.
            Taking you to the showcase…
          </p>
        </div>
      </AuthShell>
    );
  }

  const blocked =
    usernameStatus.state === 'invalid' ||
    usernameStatus.state === 'reserved' ||
    usernameStatus.state === 'taken';

  return (
    <AuthShell
      title="Choose your username"
      description="One last step before you start showing off your platinums."
      aside={
        <AuthUtilityAside
          illustration={<HandleSetupIllustration />}
          title="Almost there."
          description="Pick the handle that will sit under every platinum you post."
          points={[
            'Your handle is your public profile: /u/your-handle.',
            'We copy your Google photo as your avatar; you can replace it any time in Settings.',
            'Handles can be changed once every 12 months, so pick with care.',
          ]}
        />
      }
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
