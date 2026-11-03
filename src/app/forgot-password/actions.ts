"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { emailFormatProblem, normalizeEmail } from "@/lib/email/address";
import { requestPasswordReset } from "@/lib/email/password-reset";

export interface ForgotPasswordState {
  error?: string;
  success?: boolean;
}

const GENERIC_ERROR =
  "Too many requests. Please wait a few minutes and try again.";

export async function requestPasswordResetAction(
  _state: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  const format = emailFormatProblem(email);
  if (format) return { error: format };

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";

  const perEmail = await checkRateLimit(`reset:${email}`, 3, 3_600_000);
  const perIp = await checkRateLimit(`reset-ip:${ip}`, 10, 3_600_000);
  if (!perEmail.ok || !perIp.ok) return { error: GENERIC_ERROR };

  // Same response whether the account exists or not. The work happens after
  // the response so the timing does not leak either.
  after(async () => {
    try {
      await requestPasswordReset(email);
    } catch (error) {
      console.error("[forgot-password] could not issue reset", error);
    }
  });

  return { success: true };
}
