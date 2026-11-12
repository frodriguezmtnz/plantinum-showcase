'use client';

import { useActionState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  confirmAccountDeleteAction,
  type ConfirmAccountDeleteState,
} from './actions';

const initialState: ConfirmAccountDeleteState = {};

export function ConfirmAccountDeleteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    confirmAccountDeleteAction,
    initialState,
  );

  useEffect(() => {
    if (!state.success) return;
    // The account row is gone, so the session cookie is worthless. Clear it
    // and land on the sign-in page with a notice.
    void signOut({ callbackUrl: '/login?deleted=1' });
  }, [state.success]);

  if (state.success) {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">
          Your account and plates are gone. Taking you to the sign-in page…
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
      <AlertTriangle
        className="mx-auto h-10 w-10 text-destructive"
        aria-hidden
      />
      <p className="text-center text-sm text-muted-foreground">
        Deleting removes your profile, every platinum and all uploaded images.
        This cannot be undone.
      </p>
      <Button
        type="submit"
        variant="destructive"
        className="w-full"
        disabled={isPending}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Deleting…' : 'Delete forever'}
      </Button>
    </form>
  );
}
