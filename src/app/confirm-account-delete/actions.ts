"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { consumeAccountDelete } from "@/lib/email/account-delete";

export interface ConfirmAccountDeleteState {
  success?: boolean;
  username?: string | null;
  error?: string;
}

const INVALID_COPY = "This confirmation link is not valid.";

export async function confirmAccountDeleteAction(
  _state: ConfirmAccountDeleteState,
  formData: FormData,
): Promise<ConfirmAccountDeleteState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      error: "Your session expired. Sign in again to confirm the deletion.",
    };
  }

  const token = String(formData.get("token") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local";
  if (!(await checkRateLimit(`account-delete-confirm:${ip}`, 20, 3_600_000)).ok) {
    return {
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  if (!token || token.length > 512) {
    return { error: INVALID_COPY };
  }

  const result = await consumeAccountDelete({ token, userId });
  if (!result.ok) {
    switch (result.reason) {
      case "expired":
        return {
          error:
            "This confirmation link has expired. Request a new one from Settings.",
        };
      case "used":
        return { error: "This link has already been used." };
      case "forbidden":
        return {
          error:
            "This link was sent to a different account. Sign in with the account you want to delete.",
        };
      default:
        return { error: INVALID_COPY };
    }
  }

  return { success: true, username: result.username };
}
