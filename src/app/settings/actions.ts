"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import sharp from "sharp";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectImageType } from "@/lib/image-signature";
import {
  avatarImageKey,
  deleteImage,
  isStorageConfigured,
  putImage,
} from "@/lib/b2";
import { imageKeyFromUrl } from "@/lib/moderation-core";
import { usernameIsTaken, reserveUsername } from "@/lib/username-registry";
import {
  formatUsernameChangeDate,
  usernameCooldownStatus,
} from "@/lib/username-policy";
import { triageImageHash } from "@/lib/ai-triage";
import {
  BIO_MAX_LENGTH,
  BIO_PROBLEM_MESSAGE,
  bioProblem,
  sanitizeBio,
} from "@/lib/bio";
import { passwordPolicyError } from "@/lib/password";
import {
  buildPsnProfileUrl,
  parsePsnProfileUrl,
  psnHandleProblem,
  PSN_PROFILE_ERROR,
  type PsnProvider,
} from "@/lib/psn";
import {
  USERNAME_PROBLEM_MESSAGE,
  usernameProblem,
} from "@/lib/usernames";

export type ProfileUpdateResult =
  | { success: true; bio: string | null; psnProfileUrl: string | null }
  | { success: false; error: string };

export type UsernameUpdateResult =
  | { success: true; username: string; changedAt: string }
  | { success: false; error: string };

export type AvatarUpdateResult =
  | { success: true; image: string; warning?: string }
  | { success: false; error: string };

export type PasswordUpdateResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_EDGE = 256;

const RATE_LIMITED =
  "Too many changes at once. Please wait a moment and try again.";

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function defaultAvatarFor(username: string | null, userId: string): string {
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(username ?? userId)}`;
}

function revalidateProfile(username: string | null | undefined): void {
  if (username) revalidatePath(`/u/${username}`);
}

/** Bio + the optional PlayStation profile link. */
export async function updateProfile(
  formData: FormData,
): Promise<ProfileUpdateResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  if (!(await checkRateLimit(`settings-profile:${userId}`, 20, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  // Reject markup outright; sanitize as a second line of defence.
  const rawBio = String(formData.get("bio") ?? "");
  const bioIssue = bioProblem(rawBio);
  if (bioIssue) {
    return { success: false, error: BIO_PROBLEM_MESSAGE[bioIssue] };
  }
  const bio = sanitizeBio(rawBio);
  if (bio.length > BIO_MAX_LENGTH) {
    return {
      success: false,
      error: `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`,
    };
  }

  const providerRaw = String(formData.get("psnProvider") ?? "psnprofiles");
  const provider: PsnProvider =
    providerRaw === "playstation" ? "playstation" : "psnprofiles";
  const handle = String(formData.get("psnHandle") ?? "").trim();

  let psnProfileUrl: string | null = null;
  if (handle) {
    if (psnHandleProblem(handle)) {
      return {
        success: false,
        error:
          "PSN nickname must be 3–16 characters: letters, numbers, dashes or underscores.",
      };
    }
    const parsed = parsePsnProfileUrl(buildPsnProfileUrl(provider, handle));
    if (!parsed.ok) {
      return { success: false, error: PSN_PROFILE_ERROR[parsed.reason] };
    }
    psnProfileUrl = parsed.url;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      bio: bio || null,
      psnProfileUrl,
    },
    select: { username: true },
  });

  revalidateProfile(user.username);
  return { success: true, bio: bio || null, psnProfileUrl };
}

/**
 * Handle changes are rare and touch the public URL, so they are throttled and
 * checked case-insensitively. The client refreshes the session afterwards.
 */
export async function updateUsername(
  input: string,
): Promise<UsernameUpdateResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  const username = (input ?? "").trim();
  const problem = usernameProblem(username);
  if (problem) {
    return { success: false, error: USERNAME_PROBLEM_MESSAGE[problem] };
  }

  if (!(await checkRateLimit(`settings-username:${userId}`, 5, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, usernameChangedAt: true },
  });
  if (!current) {
    return { success: false, error: "Your account could not be found." };
  }

  const cooldown = usernameCooldownStatus(current.usernameChangedAt);
  if (cooldown.locked && cooldown.nextAt) {
    return {
      success: false,
      error: `You can change your username again on ${formatUsernameChangeDate(cooldown.nextAt)}.`,
    };
  }

  if (current.username === username) {
    return {
      success: true,
      username,
      changedAt: (current.usernameChangedAt ?? new Date()).toISOString(),
    };
  }

  if (await usernameIsTaken(username, userId)) {
    return { success: false, error: "That username is already taken." };
  }

  const changedAt = new Date();
  const sameLower =
    current.username?.toLowerCase() === username.toLowerCase();

  try {
    await prisma.$transaction(async (tx) => {
      // A case-only change does not free a different handle, so it is not
      // reserved (and would otherwise collide with the user's own history).
      if (current.username && !sameLower) {
        await reserveUsername(current.username, userId, tx);
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          username,
          name: username,
          usernameChangedAt: changedAt,
        },
      });
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return { success: false, error: "That username is already taken." };
    }
    console.error("[settings] username update failed", error);
    return { success: false, error: "Could not change the username." };
  }

  revalidateProfile(current.username);
  revalidateProfile(username);
  return { success: true, username, changedAt: changedAt.toISOString() };
}

/** Square AVIF avatar, one stable key per account (overwrite replaces it). */
export async function updateAvatar(
  formData: FormData,
): Promise<AvatarUpdateResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  if (!isStorageConfigured()) {
    return { success: false, error: "Image storage is not configured yet." };
  }

  if (!(await checkRateLimit(`settings-avatar:${userId}`, 10, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Pick an image first." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "The image exceeds the 4 MB size limit." };
  }
  if (file.type && !ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { success: false, error: "Unsupported format. Use JPG, PNG or WEBP." };
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(input)) {
    return { success: false, error: "Unsupported format. Use JPG, PNG or WEBP." };
  }

  let processed: Buffer;
  try {
    processed = await sharp(input)
      .rotate()
      .resize({
        width: AVATAR_EDGE,
        height: AVATAR_EDGE,
        fit: "cover",
      })
      .avif({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error("[settings] avatar processing failed", error);
    return { success: false, error: "The file is not a valid image." };
  }

  // Screen the image that will actually be published, not the raw upload.
  // Fail-open on purpose (product decision): UNSAFE is always rejected, but a
  // REVIEW verdict or a classifier outage keeps the upload and shows a warning.
  let verdict: { label: string } | null = null;
  try {
    const hash = createHash("sha256").update(processed).digest("hex");
    const triage = await triageImageHash({
      hash: `avatar:${hash}`,
      data: processed,
      mimeType: "image/avif",
      kind: "avatar",
    });
    verdict = triage.verdict;
  } catch (error) {
    console.warn("[settings] avatar screening failed", error);
  }

  if (verdict?.label === "UNSAFE") {
    return {
      success: false,
      error: "That image cannot be used as an avatar.",
    };
  }

  const warning =
    !verdict || verdict.label === "REVIEW"
      ? "We could not fully verify this avatar, so it may be reviewed later."
      : undefined;

  try {
    await putImage(avatarImageKey(userId), processed);
  } catch (error) {
    console.error("[settings] avatar storage put failed", error);
    return { success: false, error: "Could not upload the avatar. Try again." };
  }

  const image = `/api/avatars/${userId}?v=${Date.now()}`;
  const user = await prisma.user.update({
    where: { id: userId },
    data: { image },
    select: { username: true },
  });

  revalidateProfile(user.username);
  revalidatePath("/", "layout");
  return { success: true, image, warning };
}

/** Removes the stored object and falls back to the generated avatar. */
export async function removeAvatar(): Promise<AvatarUpdateResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  if (!(await checkRateLimit(`settings-avatar:${userId}`, 10, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  if (isStorageConfigured()) {
    try {
      await deleteImage(avatarImageKey(userId));
    } catch {
      // Best effort: clearing the DB reference is what the user sees.
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const image = defaultAvatarFor(user?.username ?? null, userId);

  await prisma.user.update({ where: { id: userId }, data: { image } });

  revalidateProfile(user?.username ?? null);
  revalidatePath("/", "layout");
  return { success: true, image };
}

export async function changePassword(
  formData: FormData,
): Promise<PasswordUpdateResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  if (!(await checkRateLimit(`settings-password:${userId}`, 10, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return {
      success: false,
      error: "This account has no password to change.",
    };
  }

  const passwordIssue = passwordPolicyError(next);
  if (passwordIssue) {
    return { success: false, error: passwordIssue };
  }
  if (next !== confirm) {
    return { success: false, error: "The new passwords do not match." };
  }
  if (next === current) {
    return {
      success: false,
      error: "The new password must be different from the current one.",
    };
  }

  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) {
    return { success: false, error: "The current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}

/**
 * Irreversible. Plates and their stored images go away, frozen monthly rows
 * keep their display data but lose the (now dead) link, and the account is
 * deleted in cascade. The client signs out on success.
 */
export async function deleteAccount(
  formData: FormData,
): Promise<DeleteAccountResult> {
  const userId = await requireUserId();
  if (!userId) return { success: false, error: "You need to sign in first." };

  if (!(await checkRateLimit(`settings-delete:${userId}`, 3, 3_600_000)).ok) {
    return { success: false, error: RATE_LIMITED };
  }

  const confirmUsername = String(formData.get("confirmUsername") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      passwordHash: true,
      platinums: { select: { id: true, imageUrl: true, hash: true } },
    },
  });
  if (!user?.passwordHash) {
    return { success: false, error: "Your account could not be found." };
  }
  if (!user.username || confirmUsername !== user.username) {
    return {
      success: false,
      error: "Type your username exactly to confirm the deletion.",
    };
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    return { success: false, error: "The password is incorrect." };
  }

  const platinumIds = user.platinums.map((plate) => plate.id);

  await prisma.$transaction(async (tx) => {
    // Freeing the handle forever keeps old links from resolving to a stranger.
    if (user.username) {
      await reserveUsername(user.username, userId, tx);
    }
    if (platinumIds.length > 0) {
      await tx.monthlyResult.updateMany({
        where: { platinumId: { in: platinumIds } },
        data: { platinumId: null },
      });
    }
    await tx.user.delete({ where: { id: userId } });
  });

  // Storage cleanup after the cascade: only drop bytes no other plate shares.
  const seen = new Set<string>();
  for (const plate of user.platinums) {
    if (seen.has(plate.hash)) continue;
    seen.add(plate.hash);
    const remaining = await prisma.platinum.count({
      where: { hash: plate.hash },
    });
    if (remaining > 0) continue;
    const key = imageKeyFromUrl(plate.imageUrl);
    if (!key) continue;
    try {
      await deleteImage(key);
    } catch {
      // Best effort, same policy as moderation deletes.
    }
  }

  if (isStorageConfigured()) {
    try {
      await deleteImage(avatarImageKey(userId));
    } catch {
      // No avatar stored, or storage down.
    }
  }

  revalidatePath("/", "layout");
  return { success: true };
}
