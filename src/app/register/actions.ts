"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { signIn } from "@/auth";

export interface RegisterState {
  error?: string;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Handles we never hand out (impersonation / brand / infra). */
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "support",
  "moderator",
  "staff",
  "platinum",
  "showcase",
  "system",
  "official",
  "root",
]);

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

  if (username.length < 3 || username.length > 20 || !USERNAME_PATTERN.test(username)) {
    return { available: false, reason: "invalid" };
  }
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { available: false, reason: "reserved" };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!checkRateLimit(`username-check:${ip}`, 60, 60_000).ok) {
    return { available: false, reason: "rate-limited" };
  }

  const taken = await prisma.user.count({
    where: { username: { equals: username, mode: "insensitive" } },
  });

  return taken > 0 ? { available: false, reason: "taken" } : { available: true };
}

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || username.length < 3) {
    return { error: "Username must be at least 3 characters." };
  }
  if (username.length > 20) {
    return { error: "Username must be 20 characters or fewer." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Username can only use letters, numbers, dashes and underscores." };
  }
  if (RESERVED_USERNAMES.has(username.toLowerCase())) {
    return { error: "That username is reserved." };
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
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: { equals: username, mode: "insensitive" } }],
      },
    });

    if (existing) {
      return {
        error:
          existing.email === email
            ? "An account with that email already exists."
            : "That username is already taken.",
      };
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

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
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

  return {};
}
