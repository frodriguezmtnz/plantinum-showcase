"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { safeRelativeCallback } from "@/lib/callback-url";

export interface LoginState {
  error?: string;
  /** Set on success; the page refreshes the client session and navigates. */
  redirectTo?: string;
  /** The password was correct but the account needs its TOTP/recovery code. */
  requiresTwoFactor?: boolean;
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const otp = (formData.get("otp") as string | undefined)?.trim();

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  // Only allow same-site relative paths back (never "//host" or absolute URLs).
  const callbackUrl = safeRelativeCallback(
    formData.get("callbackUrl") as string | undefined,
  );

  // Brute-force limits are enforced inside authorize() (src/auth.ts) so both
  // this action and direct calls to the Auth.js endpoint share the budget.
  try {
    // `redirect: false` keeps the navigation on the client so the page can
    // refresh the session provider before moving on; letting next-auth redirect
    // here would leave the cached header session stale until a hard reload.
    await signIn("credentials", {
      email,
      password,
      ...(otp ? { otp } : {}),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      if (error.code === "2fa_required") return { requiresTwoFactor: true };
      if (error.code === "login_rate_limited") {
        return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
      }
      if (error.code === "2fa_rate_limited") {
        return {
          error:
            "Too many authentication attempts. Please wait a few minutes and try again.",
          requiresTwoFactor: Boolean(otp),
        };
      }
      return {
        error: "Incorrect email, password or authentication code.",
        requiresTwoFactor: Boolean(otp),
      };
    }
    if (error instanceof AuthError) {
      return { error: "Could not sign in." };
    }
    throw error;
  }

  return { redirectTo: callbackUrl };
}
