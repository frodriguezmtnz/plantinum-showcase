"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeEmailChange } from "@/lib/email/change-email";

export interface ConfirmEmailChangeState {
  success?: boolean;
  email?: string;
  error?: string;
}

const INVALID_COPY = "This confirmation link is not valid.";

export async function confirmEmailChangeAction(
  _state: ConfirmEmailChangeState,
  formData: FormData,
): Promise<ConfirmEmailChangeState> {
  const token = String(formData.get("token") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!(await checkRateLimit(`email-change-confirm:${ip}`, 20, 3_600_000)).ok) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  if (!token || token.length > 512) {
    return { error: INVALID_COPY };
  }

  const result = await consumeEmailChange({ token });
  if (!result.ok) {
    switch (result.reason) {
      case "expired":
        return {
          error:
            "This confirmation link has expired. Request a new one from Settings.",
        };
      case "used":
        return { error: "This link has already been used." };
      case "in-use":
        return {
          error:
            "That email address can no longer be used. Choose a different one from Settings.",
        };
      case "same":
        return { error: "That is already your email address." };
      default:
        return { error: INVALID_COPY };
    }
  }

  return { success: true, email: result.email };
}
