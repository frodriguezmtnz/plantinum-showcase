"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeEmailVerification } from "@/lib/email/verification";

export interface VerifyEmailState {
  success?: boolean;
  alreadyVerified?: boolean;
  error?: string;
}

export async function verifyEmailAction(
  _state: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const token = String(formData.get("token") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!(await checkRateLimit(`verify-email:${ip}`, 20, 3_600_000)).ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  if (!token || token.length > 512) {
    return { error: "This verification link is invalid or has expired." };
  }

  const result = await consumeEmailVerification({ token });
  if (!result.ok) {
    return { error: "This verification link is invalid or has expired." };
  }

  return { success: true, alreadyVerified: result.alreadyVerified };
}
