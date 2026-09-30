"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { signIn } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS_PER_EMAIL = 8;
const MAX_ATTEMPTS_PER_IP = 20;
const WINDOW_MS = 5 * 60_000;

export interface LoginState {
  error?: string;
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  // Only allow same-site relative paths back (never "//host" or absolute URLs).
  const rawCallback = (formData.get("callbackUrl") as string | undefined)?.trim();
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/";

  // Brute-force barrier: cap attempts per account and per client address.
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const perEmail = checkRateLimit(`login:${email}`, MAX_ATTEMPTS_PER_EMAIL, WINDOW_MS);
  const perIp = checkRateLimit(`login-ip:${ip}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS);
  if (!perEmail.ok || !perIp.ok) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Incorrect email or password." };
        default:
          return { error: "Could not sign in." };
      }
    }
    throw error;
  }

  return {};
}
