'use client';

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerAction, type RegisterState } from "./actions";
import { useAuth } from "@/hooks/use-auth";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";
import { PasswordRules } from "@/components/shared/password-rules";
import { UsernameHint } from "@/components/shared/username-hint";
import { PASSWORD_MIN_LENGTH, passwordPolicyError } from "@/lib/password";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();
  // Refreshing the session re-renders the provider, so guard against running
  // the post-sign-up navigation more than once.
  const navigatedRef = useRef(false);

  // Sign-up signs the user in through a server action, so refresh the client
  // session before navigating or the header stays stuck on "Sign in".
  useEffect(() => {
    if (!state.redirectTo || navigatedRef.current) return;
    navigatedRef.current = true;
    const target = state.redirectTo;
    refresh()
      .catch(() => undefined)
      .finally(() => router.push(target));
  }, [state.redirectTo, refresh, router]);

  const usernameStatus = useUsernameAvailability(username);

  const [googlePending, setGooglePending] = useState(false);
  async function handleGoogleSignUp() {
    setGooglePending(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setGooglePending(false);
    }
  }

  const passwordIssue = password ? passwordPolicyError(password) : null;
  const passwordsMatch =
    password.length > 0 && password === confirmPassword;
  const blocked =
    usernameStatus.state === 'invalid' ||
    usernameStatus.state === 'reserved' ||
    usernameStatus.state === 'taken' ||
    Boolean(passwordIssue) ||
    !passwordsMatch;

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
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            aria-describedby="register-password-rules"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
          />
          <PasswordRules
            id="register-password-rules"
            value={password}
            confirm={confirmPassword}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending || blocked}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating account..." : "Create Account"}
        </Button>
        <p className="-mt-1 text-center text-xs text-muted-foreground">
          We will email you a link to verify your address. Uploading, voting and
          following unlock once it is confirmed.
        </p>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
          <span className="bg-background px-2">or</span>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googlePending || isPending}
      >
        {googlePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {googlePending ? 'Redirecting to Google...' : 'Sign up with Google'}
      </Button>
    </AuthShell>
  );
}
