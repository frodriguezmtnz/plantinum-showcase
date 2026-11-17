"use server";

import { headers } from "next/headers";
import { getClientIp } from "@/lib/client-ip";
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

  const ip = getClientIp(await headers());
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
