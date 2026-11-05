'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from './actions';

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          If that email belongs to an account, you will get a reset link in a
          few minutes. The link expires in 60 minutes and can only be used once.
        </p>
        <p className="text-xs text-muted-foreground">
          Nothing yet? Check your spam folder, or try again in a bit.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="m@example.com"
          autoComplete="email"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isPending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
