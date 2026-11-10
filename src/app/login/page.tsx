'use client';

import { use, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { useAuth } from "@/hooks/use-auth";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";
import { useAutoSubmitTotp } from "@/hooks/use-auto-submit-totp";

const initialState: LoginState = {};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    reset?: string;
    verified?: string;
    password?: string;
    email?: string;
    twofactor?: string;
  }>;
}) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const { callbackUrl, reset, verified, password, email, twofactor } =
    use(searchParams);
  const router = useRouter();
  const { refresh } = useAuth();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  // Refreshing the session re-renders the provider, so guard against running
  // the post-sign-in navigation more than once.
  const navigatedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  useAutoSubmitTotp({
    value: otp,
    enabled: !!state.requiresTwoFactor && !useRecoveryCode,
    pending: isPending,
    onSubmit: () => formRef.current?.requestSubmit(),
  });

  const notice =
    reset === 'success'
      ? 'Password updated. Sign in with your new password.'
      : password === 'changed'
        ? 'Password changed. Sign in again with your new password; other sessions were closed.'
        : email === 'changed'
          ? 'Email updated. Sign in again with your new address; other sessions were closed.'
          : verified === '1'
            ? 'Email verified. Uploading, voting and following are unlocked.'
            : twofactor === 'enabled'
              ? 'Two-factor authentication is on. Sign in with your authenticator code.'
              : twofactor === 'disabled'
                ? 'Two-factor authentication is off. Sign in with your password.'
                : undefined;

  // Sign-in runs in a server action, so the client session provider has to be
  // refreshed before navigating or the header keeps showing "Sign in".
  useEffect(() => {
    if (!state.redirectTo || navigatedRef.current) return;
    navigatedRef.current = true;
    const target = state.redirectTo;
    refresh()
      .catch(() => undefined)
      .finally(() => router.push(target));
  }, [state.redirectTo, refresh, router]);

  return (
    <AuthShell
      title="Sign In"
      description="Join the community to vote on and show off your platinums."
      error={state.error}
      notice={notice}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </>
      }
    >
      <form ref={formRef} action={formAction} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
        {state.requiresTwoFactor ? (
          <>
            <input type="hidden" name="email" value={loginEmail} />
            <input type="hidden" name="password" value={loginPassword} />
            <p className="text-sm text-muted-foreground">
              Signing in as <strong className="text-foreground">{loginEmail}</strong>
            </p>
            <div className="grid gap-2">
              <Label htmlFor="otp">
                {useRecoveryCode ? 'Recovery code' : 'Authentication code'}
              </Label>
              <Input
                id="otp"
                name="otp"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                inputMode={useRecoveryCode ? 'text' : 'numeric'}
                autoComplete="one-time-code"
                placeholder={useRecoveryCode ? 'XXXX-XXXX-XXXX-XXXX-XXXX' : '123456'}
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">
                {useRecoveryCode
                  ? 'Each recovery code works once.'
                  : 'Open your authenticator app and enter the current 6-digit code.'}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isPending || !otp}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Verifying...' : 'Verify and sign in'}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                className="font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setUseRecoveryCode((current) => !current);
                  setOtp('');
                }}
              >
                {useRecoveryCode
                  ? 'Use authenticator code'
                  : 'Use a recovery code'}
              </button>
              <Link
                href="/login"
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Use a different account
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </>
        )}
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
        Sign in with Google
        <span className="field-mark ml-2 opacity-70">Coming soon</span>
      </Button>
    </AuthShell>
  );
}
