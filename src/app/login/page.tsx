'use client';

import { use, useActionState, useEffect, useRef } from "react";
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

const initialState: LoginState = {};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const { callbackUrl } = use(searchParams);
  const router = useRouter();
  const { refresh } = useAuth();
  // Refreshing the session re-renders the provider, so guard against running
  // the post-sign-in navigation more than once.
  const navigatedRef = useRef(false);

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
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="underline">
            Sign up
          </Link>
        </>
      }
    >
      <form action={formAction} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl ?? "/"} />
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" name="password" required />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Signing in..." : "Sign In"}
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
        Sign in with Google
        <span className="field-mark ml-2 opacity-70">Coming soon</span>
      </Button>
    </AuthShell>
  );
}
