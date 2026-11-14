"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { usernameIsTaken } from "@/lib/username-registry";
import {
  USERNAME_PROBLEM_MESSAGE,
  usernameProblem,
} from "@/lib/usernames";
import { importGoogleAvatar } from "@/lib/google-avatar";
import { safeRelativeCallback } from "@/lib/callback-url";

export interface WelcomeState {
  error?: string;
  /** Set on success; the page refreshes the session and navigates. */
  redirectTo?: string;
  /**
   * Only present when the handle was just created. The client uses it to
   * celebrate and show the success screen; the already-onboarded path only
   * carries `redirectTo`.
   */
  username?: string;
}

/**
 * Completes the profile of a Google-created account: picks a handle, imports
 * the Google avatar into B2 and marks the email as verified (Google already
 * verified it before we allowed the sign-in).
 */
export async function completeOAuthProfile(
  _state: WelcomeState,
  formData: FormData,
): Promise<WelcomeState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "You need to sign in first." };

  if (!(await checkRateLimit(`welcome:${userId}`, 10, 3_600_000)).ok) {
    return { error: "Too many attempts. Please wait a bit and try again." };
  }

  const requested = safeRelativeCallback(
    formData.get("callbackUrl") as string | undefined,
  );
  const callbackUrl = requested.startsWith("/welcome") ? "/" : requested;
  const username = String(formData.get("username") ?? "").trim();

  const problem = usernameProblem(username);
  if (problem) return { error: USERNAME_PROBLEM_MESSAGE[problem] };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      image: true,
      emailVerified: true,
      accounts: {
        where: { provider: "google" },
        select: { provider: true },
      },
    },
  });
  if (!user) return { error: "Your account could not be found." };
  if (user.username) return { redirectTo: callbackUrl };
  if (user.accounts.length === 0) {
    return { error: "This setup flow is only available for Google accounts." };
  }

  if (await usernameIsTaken(username, userId)) {
    return { error: "That username is already taken." };
  }

  // The adapter stored the Google picture URL. Replace it with the B2 copy;
  // on any failure clear it so the generated avatar is used instead (and the
  // strict img-src CSP never sees an external URL).
  const externalImage = user.image?.startsWith("https://") ? user.image : null;
  const image = externalImage
    ? await importGoogleAvatar({ userId, url: externalImage })
    : user.image;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        image,
        emailVerified: user.emailVerified ?? new Date(),
      },
    });
  } catch (error) {
    // Sign-ups racing on the same handle slip past the pre-check; the unique
    // index catches them, so translate the violation for the user.
    if ((error as { code?: string }).code === "P2002") {
      return { error: "That username is already taken." };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  revalidatePath(`/u/${username}`);

  return { redirectTo: callbackUrl, username };
}
