'use client';

import { useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { fireAccountReadyConfetti } from '@/lib/celebrate';
import { verifyEmailAction, type VerifyEmailState } from './actions';

const initialState: VerifyEmailState = {};

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    verifyEmailAction,
    initialState,
  );
  const { refresh } = useAuth();
  const celebrated = useRef(false);

  useEffect(() => {
    if (!state.success) return;
    refresh().catch(() => undefined);

    if (!state.alreadyVerified && !celebrated.current) {
      celebrated.current = true;
      void fireAccountReadyConfetti();
    }
  }, [state.success, state.alreadyVerified, refresh]);

  if (state.success) {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-12 w-12 text-live" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Your email is verified. Uploading, voting and following are unlocked.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/upload">Upload a platinum</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Go to Settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <MailCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
      <p className="text-center text-sm text-muted-foreground">
        Confirm this address belongs to you. The link can only be used once.
      </p>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Verifying…' : 'Confirm email'}
      </Button>
    </form>
  );
}
