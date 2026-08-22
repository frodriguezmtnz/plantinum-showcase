"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o contraseña incorrectos." };
        default:
          return { error: "No se pudo iniciar sesión." };
      }
    }
    throw error;
  }

  return {};
}