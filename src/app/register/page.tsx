'use client';

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { registerAction, checkUsernameAvailability } from "./actions";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";
import { cn } from "@/lib/utils";

const initialState: { error?: string } = {};

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

type UsernameStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available' }
  | { state: 'invalid' | 'reserved' | 'taken' | 'rate-limited' };

function UsernameHint({ status, username }: { status: UsernameStatus; username: string }) {
  const base = 'flex items-center gap-1.5 text-xs';

  switch (status.state) {
    case 'checking':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking availability…
        </p>
      );
    case 'available':
      return (
        <p className={cn(base, 'text-emerald-500')}>
          <Check className="h-3.5 w-3.5" />
          {username} is available
        </p>
      );
    case 'taken':
      return (
        <p className={cn(base, 'text-destructive')}>
          <X className="h-3.5 w-3.5" />
          That username is already taken.
        </p>
      );
    case 'reserved':
      return (
        <p className={cn(base, 'text-destructive')}>
          <X className="h-3.5 w-3.5" />
          That username is reserved.
        </p>
      );
    case 'rate-limited':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <X className="h-3.5 w-3.5" />
          Too many checks — wait a moment and try again.
        </p>
      );
    case 'invalid':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <X className="h-3.5 w-3.5" />
          Use 3–20 characters: letters, numbers, dashes or underscores.
        </p>
      );
    default:
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          3–20 characters — letters, numbers, dashes and underscores.
        </p>
      );
  }
}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [username, setUsername] = useState('');
  const [checkResult, setCheckResult] = useState<{ forUsername: string; status: UsernameStatus } | null>(
    null,
  );
  const requestId = useRef(0);

  // Only the async probe lives in the effect; the fast "empty/invalid/checking"
  // states are derived below so no setState runs synchronously in an effect.
  useEffect(() => {
    const value = username.trim();
    if (value.length < 3 || value.length > 20 || !USERNAME_PATTERN.test(value)) return;

    const id = (requestId.current += 1);
    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(value);
        if (requestId.current !== id) return; // a newer keystroke already won
        setCheckResult({
          forUsername: value,
          status: result.available ? { state: 'available' } : { state: result.reason ?? 'taken' },
        });
      } catch {
        if (requestId.current === id) setCheckResult(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  const trimmed = username.trim();
  const shapeValid =
    trimmed.length >= 3 && trimmed.length <= 20 && USERNAME_PATTERN.test(trimmed);
  const usernameStatus: UsernameStatus =
    trimmed.length === 0
      ? { state: 'idle' }
      : !shapeValid
        ? { state: 'invalid' }
        : checkResult && checkResult.forUsername === trimmed
          ? checkResult.status
          : { state: 'checking' };

  const blocked =
    usernameStatus.state === 'invalid' ||
    usernameStatus.state === 'reserved' ||
    usernameStatus.state === 'taken';

  return (
    <AuthShell
      title="Create Account"
      description="Join the community and show off your platinum trophies."
      error={state.error}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="trophy-hunter"
            required
            minLength={3}
            maxLength={20}
            autoComplete="username"
            aria-describedby="username-hint"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <div id="username-hint" role="status" aria-live="polite">
            <UsernameHint status={usernameStatus} username={username.trim()} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required minLength={6} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" name="confirmPassword" required minLength={6} />
        </div>
        <Button type="submit" className="w-full" disabled={isPending || blocked}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
          <span className="bg-background px-2">or</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" type="button" disabled title="Coming soon">
        Sign up with Google
      </Button>
    </AuthShell>
  );
}
