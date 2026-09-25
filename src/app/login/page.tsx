'use client';

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginAction } from "./actions";
import { AuthShell } from "@/components/shared/auth-shell";
import { PasswordInput } from "@/components/shared/password-input";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

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
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <span className="ml-auto inline-block text-sm underline opacity-40">Forgot your password?</span>
          </div>
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
      </Button>
    </AuthShell>
  );
}
