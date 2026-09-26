"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

export interface RegisterState {
  error?: string;
}

export async function registerAction(_state: RegisterState, formData: FormData): Promise<RegisterState> {
  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!username || username.length < 3) {
    return { error: "Username must be at least 3 characters." };
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
      where: { OR: [{ email }, { username }] },
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
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in manually." };
    }
    throw error;
  }

  return {};
}
