"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { checkRateLimit } from "@/lib/rate-limit";
import { passwordPolicyError } from "@/lib/password";
import {
  consumePasswordReset,
  sendPasswordChangedNotice,
} from "@/lib/email/password-reset";

export interface ResetPasswordState {
  error?: string;
  redirectTo?: string;
}

const INVALID_LINK =
  "This reset link is invalid or has expired. Request a new one.";
const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";

export async function resetPasswordAction(
  _state: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!(await checkRateLimit(`reset-submit:${ip}`, 10, 3_600_000)).ok) {
    return { error: TOO_MANY };
  }

  if (!token || token.length > 512) return { error: INVALID_LINK };

  const passwordIssue = passwordPolicyError(password);
  if (passwordIssue) return { error: passwordIssue };
  if (password !== confirm) return { error: "The passwords do not match." };

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await consumePasswordReset({ token, passwordHash });
  if (!result.ok) return { error: INVALID_LINK };

  after(async () => {
    try {
      await sendPasswordChangedNotice(result.user);
    } catch (error) {
      console.error("[reset-password] could not send the security notice", error);
    }
  });

  return { redirectTo: "/login?reset=success" };
}
