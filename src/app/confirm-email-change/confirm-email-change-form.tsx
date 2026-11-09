'use client';

import { useActionState, useEffect } from 'react';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  confirmEmailChangeAction,
  type ConfirmEmailChangeState,
} from './actions';

const initialState: ConfirmEmailChangeState = {};

export function ConfirmEmailChangeForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmEmailChangeAction,
    initialState,
  );

  useEffect(() => {
    if (!state.success) return;
    // Confirming bumped User.sessionVersion, so every JWT (including this tab)
    // is already invalid. Clear the cookie and ask for a fresh sign-in.
    void signOut({ callbackUrl: '/login?email=changed' });
  }, [state.success]);

  if (state.success) {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto h-12 w-12 text-live" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Your email is updated. Taking you to sign in with the new address…
        </p>
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
        This makes the new address your sign-in email. It can only be used
        once, and every session will be closed.
      </p>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Confirming…' : 'Confirm new email'}
      </Button>
    </form>
  );
}
