'use client';

import { useActionState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { FarewellTrophyIllustration } from '@/components/shared/auth-illustrations';
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
    // Let the farewell animation play before the session cookie is cleared.
    const timer = window.setTimeout(() => {
      void signOut({ callbackUrl: '/login?deleted=1' });
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [state.success]);

  if (state.success) {
    return (
      <div className="space-y-4 text-center" role="status" aria-live="polite">
        <FarewellTrophyIllustration />
        <p className="text-sm text-muted-foreground">
          Your account and all its plates are gone. Take care, trophy hunter.
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
