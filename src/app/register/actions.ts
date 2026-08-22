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
    return { error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El email no es válido." };
  }
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return {
        error:
          existing.email === email
            ? "Ya existe una cuenta con ese email."
            : "Ese nombre de usuario ya está en uso.",
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
      return { error: "Cuenta creada, pero no se pudo iniciar sesión. Intenta de nuevo." };
    }
    throw error;
  }

  return {};
}