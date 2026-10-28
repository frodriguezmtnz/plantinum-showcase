"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  USERNAME_PROBLEM_MESSAGE,
  usernameProblem,
} from "@/lib/usernames";
import { usernameIsTaken } from "@/lib/username-registry";
import { signIn } from "@/auth";

export interface RegisterState {
  error?: string;
  /** Set on success; the page refreshes the client session and navigates. */
  redirectTo?: string;
}

export type UsernameReason = "invalid" | "reserved" | "taken" | "rate-limited";

export interface UsernameAvailability {
  available: boolean;
  reason?: UsernameReason;
}

/**
 * Live availability probe for the register form. Validates shape, blocks
 * reserved handles and checks the table case-insensitively, throttled per IP
 * so it can't be used to bulk-enumerate accounts.
 */
export async function checkUsernameAvailability(
  rawUsername: string,
): Promise<UsernameAvailability> {
  const username = (rawUsername ?? "").trim();

  const problem = usernameProblem(username);
  if (problem) {
    return {
      available: false,
      reason: problem === "reserved" ? "reserved" : "invalid",
    };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!(await checkRateLimit(`username-check:${ip}`, 60, 60_000)).ok) {
    return { available: false, reason: "rate-limited" };
  }

  return (await usernameIsTaken(username))
    ? { available: false, reason: "taken" }
    : { available: true };
}

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const problem = usernameProblem(username ?? "");
  if (problem) {
    return { error: USERNAME_PROBLEM_MESSAGE[problem] };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "That email address is not valid." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    const emailTaken = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (emailTaken) {
      return { error: "An account with that email already exists." };
    }
    if (await usernameIsTaken(username)) {
      return { error: "That username is already taken." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        name: username,
        email,
        passwordHash,
        image: `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`,
      },
    });

    // `redirect: false` keeps navigation on the client so the page can refresh
    // the session provider first; a server-side redirect would leave the cached
    // header session stale until a hard reload.
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { redirectTo: "/" };
  } catch (error) {
    // Two sign-ups racing on the same handle/email slip past the pre-check;
    // the unique index catches them, so translate the violation for the user.
    if ((error as { code?: string }).code === "P2002") {
      const target = (error as { meta?: { target?: string[] | string } }).meta?.target;
      const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
      return {
        error: fields.includes("username")
          ? "That username is already taken."
          : "An account with that email already exists.",
      };
    }
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in manually." };
    }
    throw error;
  }
}
