"use server";

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
import { parsePsnProfileUrl, PSN_PROFILE_ERROR } from "@/lib/psn";
import {
  USERNAME_PROBLEM_MESSAGE,
  usernameProblem,
} from "@/lib/usernames";

export type ProfileUpdateResult =
  | { success: true }
  | { success: false; error: string };

export type UsernameUpdateResult =
  | { success: true; username: string }
  | { success: false; error: string };

export type AvatarUpdateResult =
  | { success: true; image: string }
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
const BIO_MAX_LENGTH = 160;

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

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > BIO_MAX_LENGTH) {
    return {
      success: false,
      error: `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`,
    };
  }

  const psn = parsePsnProfileUrl(String(formData.get("psnProfileUrl") ?? ""));
  if (!psn.ok) {
    return { success: false, error: PSN_PROFILE_ERROR[psn.reason] };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      bio: bio || null,
      psnProfileUrl: psn.url,
    },
    select: { username: true },
  });

  revalidateProfile(user.username);
  return { success: true };
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
    select: { username: true },
  });
  if (!current) {
    return { success: false, error: "Your account could not be found." };
  }
  if (current.username === username) {
    return { success: true, username };
  }

  const taken = await prisma.user.count({
    where: {
      username: { equals: username, mode: "insensitive" },
      id: { not: userId },
    },
  });
  if (taken > 0) {
    return { success: false, error: "That username is already taken." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username, name: username },
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
  return { success: true, username };
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
  revalidatePath("/");
  return { success: true, image };
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
  revalidatePath("/");
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

  if (next.length < 6) {
    return {
      success: false,
      error: "The new password must be at least 6 characters.",
    };
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
  if (platinumIds.length > 0) {
    await prisma.monthlyResult.updateMany({
      where: { platinumId: { in: platinumIds } },
      data: { platinumId: null },
    });
  }

  await prisma.user.delete({ where: { id: userId } });

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
