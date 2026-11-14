"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeRelativeCallback } from "@/lib/callback-url";

const MAX_ATTEMPTS_PER_EMAIL = 8;
const MAX_ATTEMPTS_PER_IP = 20;
const WINDOW_MS = 5 * 60_000;

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

  // Brute-force barrier: cap attempts per account and per client address.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const perEmail = await checkRateLimit(`login:${email}`, MAX_ATTEMPTS_PER_EMAIL, WINDOW_MS);
  const perIp = await checkRateLimit(`login-ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS);
  if (!perEmail.ok || !perIp.ok) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

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
