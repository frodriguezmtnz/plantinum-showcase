'use server';

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlatinumsPage, PLATINUMS_PAGE_SIZE } from "@/lib/data";
import { getCurrentPeriod } from "@/lib/period";
import { deleteImage, isStorageConfigured, putImage, storageImageKey } from "@/lib/b2";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;

const uploadSchema = z.object({
  gameName: z.string().trim().min(5).max(120),
  platform: z.enum(["PS3", "PS4", "PS5"]),
  platinumDate: z.coerce.date(),
  isSpoiler: z.boolean(),
  comment: z.string().trim().max(500).optional(),
});

export async function uploadPlatinum(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      success: false as const,
      error: "You need to sign in to upload a platinum.",
    };
  }

  if (!isStorageConfigured()) {
    return {
      success: false as const,
      error: "Image storage is not configured yet.",
    };
  }

  const parsed = uploadSchema.safeParse({
    gameName: formData.get("gameName"),
    platform: formData.get("platform"),
    platinumDate: formData.get("platinumDate"),
    isSpoiler: formData.get("isSpoiler") === "true",
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: "The form data is not valid.",
    };
  }

  const file = formData.get("screenshot");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "A screenshot is required." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      success: false as const,
      error: "The image exceeds the 6 MB size limit.",
    };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      success: false as const,
      error: "Unsupported format. Use JPG, PNG or WEBP.",
    };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let processed;
  try {
    processed = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .avif({ quality: 60, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return {
      success: false as const,
      error: "The file is not a valid image.",
    };
  }

  const hash = createHash("sha256").update(processed.data).digest("hex");
  const key = storageImageKey(hash);

  const existing = await prisma.platinum.findFirst({
    where: { userId, hash },
    select: { id: true },
  });
  if (existing) {
    return {
      success: false as const,
      error: "You already have a platinum with that same screenshot.",
    };
  }

  try {
    await putImage(key, processed.data);
  } catch {
    return {
      success: false as const,
      error: "Could not upload the image. Please try again.",
    };
  }

  const imageHint =
    parsed.data.gameName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 4)
      .join("-") || "game screenshot";

  try {
    const platinum = await prisma.platinum.create({
      data: {
        hash,
        gameName: parsed.data.gameName,
        platform: parsed.data.platform,
        platinumDate: parsed.data.platinumDate,
        isSpoiler: parsed.data.isSpoiler,
        comment: parsed.data.comment,
        userId,
        votes: 0,
        monthlyVotes: 0,
        imageUrl: `/api/images/${key}`,
        imageHint,
        width: processed.info.width,
        height: processed.info.height,
      },
    });

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/hall-of-fame");

    return { success: true as const, platinumId: platinum.id };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        success: false as const,
        error: "You already have a platinum with that same screenshot.",
      };
    }
    return {
      success: false as const,
      error: "Could not save the platinum. Please try again.",
    };
  }
}

const IMAGE_URL_PREFIX = "/api/images/";
const STORED_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

function imageKeyFromUrl(imageUrl: string): string | null {
  if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = imageUrl.slice(IMAGE_URL_PREFIX.length);
  return STORED_KEY_PATTERN.test(key) ? key : null;
}

export async function deletePlatinum(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id },
    select: { userId: true, imageUrl: true, hash: true },
  });

  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }
  if (platinum.userId !== userId) {
    return {
      success: false as const,
      error: "You can't delete a platinum that isn't yours.",
    };
  }

  const key = imageKeyFromUrl(platinum.imageUrl);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  await prisma.platinum.delete({ where: { id } });

  if (key) {
    const stillReferenced = await prisma.platinum.count({
      where: { hash: platinum.hash },
    });
    if (stillReferenced === 0) {
      try {
        await deleteImage(key);
      } catch {
        // Best effort: the DB row is already gone.
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/hall-of-fame");
  if (user?.username) {
    revalidatePath(`/u/${user.username}`);
  }

  return { success: true as const };
}

export async function getMorePlatinums(options: {
  q?: string;
  platform?: string;
  sort?: string;
  offset?: number;
}) {
  const session = await auth();
  return getPlatinumsPage({
    ...options,
    currentUserId: session?.user?.id,
    limit: PLATINUMS_PAGE_SIZE,
  });
}

export type VoteActionResult =
  | { success: true; hasVoted: boolean; votes: number; monthlyVotes: number }
  | { success: false; error: string };

export async function toggleVoteForPlatinum(
  platinumId: string,
): Promise<VoteActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "You need to sign in to vote." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: {
      userId: true,
      user: { select: { username: true } },
    },
  });

  if (!platinum) {
    return { success: false, error: "This platinum does not exist." };
  }
  if (platinum.userId === userId) {
    return {
      success: false,
      error: "You can't vote for your own platinum.",
    };
  }

  const period = getCurrentPeriod();

  const existingVote = await prisma.vote.findUnique({
    where: { userId_platinumId: { userId, platinumId } },
    select: { id: true, period: true },
  });

  try {
    if (existingVote) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.vote.delete({ where: { id: existingVote.id } });

        await tx.$executeRaw`
          UPDATE "Platinum"
          SET
            "votes" = CASE WHEN "votes" > 0 THEN "votes" - 1 ELSE 0 END,
            "monthlyVotes" = CASE
              WHEN "monthlyVotesMonth" = ${existingVote.period} AND "monthlyVotes" > 0
                THEN "monthlyVotes" - 1
              ELSE "monthlyVotes"
            END,
            "monthlyVotesMonth" = CASE
              WHEN "monthlyVotesMonth" = ${existingVote.period} AND "monthlyVotes" <= 1
                THEN NULL
              ELSE "monthlyVotesMonth"
            END
          WHERE "id" = ${platinumId}
        `;

        return tx.platinum.findUniqueOrThrow({
          where: { id: platinumId },
          select: { votes: true, monthlyVotes: true, monthlyVotesMonth: true },
        });
      });

      revalidateVotePaths(platinumId, platinum.user.username);

      return {
        success: true,
        hasVoted: false,
        votes: result.votes,
        monthlyVotes:
          result.monthlyVotesMonth === period ? result.monthlyVotes : 0,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.vote.create({ data: { platinumId, userId, period } });

      await tx.$executeRaw`
        UPDATE "Platinum"
        SET
          "votes" = "votes" + 1,
          "monthlyVotes" = CASE
            WHEN "monthlyVotesMonth" = ${period} THEN "monthlyVotes" + 1
            ELSE 1
          END,
          "monthlyVotesMonth" = ${period}
        WHERE "id" = ${platinumId}
      `;

      return tx.platinum.findUniqueOrThrow({
        where: { id: platinumId },
        select: { votes: true, monthlyVotes: true, monthlyVotesMonth: true },
      });
    });

    revalidateVotePaths(platinumId, platinum.user.username);

    return {
      success: true,
      hasVoted: true,
      votes: result.votes,
      monthlyVotes:
        result.monthlyVotesMonth === period ? result.monthlyVotes : 0,
    };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const current = await prisma.platinum.findUnique({
        where: { id: platinumId },
        select: { votes: true, monthlyVotes: true, monthlyVotesMonth: true },
      });
      return {
        success: true,
        hasVoted: true,
        votes: current?.votes ?? 0,
        monthlyVotes:
          current?.monthlyVotesMonth === period ? (current?.monthlyVotes ?? 0) : 0,
      };
    }

    return {
      success: false,
      error: "Could not record the vote. Please try again.",
    };
  }
}

function revalidateVotePaths(platinumId: string, ownerUsername?: string | null) {
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/hall-of-fame");
  revalidatePath(`/platinum/${platinumId}`);
  if (ownerUsername) {
    revalidatePath(`/u/${ownerUsername}`);
  }
}
