'use server';

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPlatinumsPage, PLATINUMS_PAGE_SIZE, countUploadsInCurrentPeriod } from "@/lib/data";
import { getCurrentPeriod } from "@/lib/period";
import { ensureSnapshots } from "@/lib/history";
import { deleteImage, isStorageConfigured, putImage, storageImageKey } from "@/lib/b2";
import { encodePlate } from "@/lib/watermark";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectImageType } from "@/lib/image-signature";
import { planConfig, quotaReached, nextPlan, uploadsRemaining } from "@/lib/plans";
import { platinumMetaInputSchema, reportSchema, watermarkPositionSchema } from "@/lib/schemas";
import { buildImageHint } from "@/lib/image-hint";
import { isModerator } from "@/lib/roles";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_EDGE = 1600;

export async function getUploadQuota() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const used = await countUploadsInCurrentPeriod(userId);
  const config = planConfig(account?.plan);
  const remaining = uploadsRemaining(used, account?.plan);
  return {
    plan: account?.plan ?? "FREE",
    used,
    limit: Number.isFinite(config.monthlyUploadLimit) ? config.monthlyUploadLimit : null,
    remaining: Number.isFinite(remaining) ? remaining : null,
    watermark: config.watermark,
  };
}

const uploadSchema = platinumMetaInputSchema.extend({
  watermarkPosition: watermarkPositionSchema,
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

  const uploadLimit = checkRateLimit(`upload:${userId}`, 10, 60 * 60_000);
  if (!uploadLimit.ok) {
    return {
      success: false as const,
      error: "Too many uploads in a short time. Please wait a bit and try again.",
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  const usedThisMonth = await countUploadsInCurrentPeriod(userId);
  if (quotaReached(usedThisMonth, account?.plan)) {
    const limit = planConfig(account?.plan).monthlyUploadLimit;
    const upgrade = nextPlan(account?.plan);
    return {
      success: false as const,
      error: `That's all ${limit} uploads for this month.${
        upgrade ? ` Upgrade to ${upgrade} for more, or come back next month.` : " Come back next month."
      }`,
    };
  }

  const parsed = uploadSchema.safeParse({
    gameName: formData.get("gameName"),
    platform: formData.get("platform"),
    platinumDate: formData.get("platinumDate"),
    isSpoiler: formData.get("isSpoiler") === "true",
    comment: formData.get("comment") || undefined,
    watermarkPosition: formData.get("watermarkPosition") || undefined,
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

  if (!detectImageType(inputBuffer)) {
    return {
      success: false as const,
      error: "Unsupported format. Use JPG, PNG or WEBP.",
    };
  }

  let processed: { data: Buffer; width: number; height: number };
  try {
    const resized = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();

    const { watermark } = planConfig(account?.plan);
    processed = await encodePlate(
      resized,
      session.user?.name ?? "player",
      watermark,
      parsed.data.watermarkPosition,
    );
  } catch (error) {
    console.error("[upload] image processing failed", error);
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
  } catch (error) {
    console.error("[upload] storage put failed", key, error);
    return {
      success: false as const,
      error: "Could not upload the image. Please try again.",
    };
  }

  const imageHint = buildImageHint(parsed.data.gameName);

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
        width: processed.width,
        height: processed.height,
        watermarked: planConfig(account?.plan).watermark,
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
    console.error("[upload] platinum create failed", error);
    return {
      success: false as const,
      error: "Could not save the platinum. Please try again.",
    };
  }
}

export interface EditPlatinumInput {
  gameName: string;
  platform: string;
  platinumDate: string;
  isSpoiler: boolean;
  comment?: string;
}

/**
 * Metadata-only edit: title, platform, date, spoiler flag and comment. The
 * screenshot is immutable (content-addressed), and the frozen `MonthlyResult`
 * history is intentionally left untouched — edits never rewrite the past.
 */
export async function editPlatinum(id: string, input: EditPlatinumInput) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }

  const editLimit = checkRateLimit(`edit:${userId}`, 20, 60 * 60_000);
  if (!editLimit.ok) {
    return {
      success: false as const,
      error: "Too many edits in a short time. Please wait a bit and try again.",
    };
  }

  const parsed = platinumMetaInputSchema.safeParse({
    gameName: input.gameName,
    platform: input.platform,
    platinumDate: input.platinumDate,
    isSpoiler: input.isSpoiler,
    comment: input.comment || undefined,
  });
  if (!parsed.success) {
    return { success: false as const, error: "The form data is not valid." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }
  if (platinum.userId !== userId) {
    return {
      success: false as const,
      error: "You can't edit a platinum that isn't yours.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });

  await prisma.platinum.update({
    where: { id },
    data: {
      gameName: parsed.data.gameName,
      platform: parsed.data.platform,
      platinumDate: parsed.data.platinumDate,
      isSpoiler: parsed.data.isSpoiler,
      comment: parsed.data.comment ?? null,
      // Alt text stays in sync with the title; the image itself never changes.
      imageHint: buildImageHint(parsed.data.gameName),
    },
  });

  revalidateVotePaths(id, user?.username);

  return { success: true as const };
}

const IMAGE_URL_PREFIX = "/api/images/";
const STORED_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

function imageKeyFromUrl(imageUrl: string): string | null {
  if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = imageUrl.slice(IMAGE_URL_PREFIX.length);
  return STORED_KEY_PATTERN.test(key) ? key : null;
}

/** Shared removal: cuts the frozen link, drops the row and cleans up B2. */
async function removePlatinumRecord(
  platinum: { id: string; imageUrl: string; hash: string },
  ownerUsername: string | null | undefined,
) {
  const key = imageKeyFromUrl(platinum.imageUrl);

  // The frozen history keeps its display data; only the now-dead link is cut
  // so archived rows never point at a 404.
  await prisma.monthlyResult.updateMany({
    where: { platinumId: platinum.id },
    data: { platinumId: null },
  });

  await prisma.platinum.delete({ where: { id: platinum.id } });

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
  revalidatePath(`/platinum/${platinum.id}`);
  if (ownerUsername) {
    revalidatePath(`/u/${ownerUsername}`);
  }
}

export async function deletePlatinum(id: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      imageUrl: true,
      hash: true,
      user: { select: { username: true } },
    },
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

  await removePlatinumRecord(platinum, platinum.user.username);

  return { success: true as const };
}

export type ModerationDecision = "dismiss" | "hide" | "delete";

/**
 * A moderator's decision on an open report. Authorization always re-reads the
 * role from the database, so it applies the moment it is granted.
 */
export async function moderateReport(reportId: string, decision: ModerationDecision) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }
  if (!(await isModerator(userId))) {
    return { success: false as const, error: "You don't have permission to moderate." };
  }
  if (!checkRateLimit(`moderate:${userId}`, 60, 60_000).ok) {
    return { success: false as const, error: "Slow down a moment and try again." };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      platinumId: true,
      platinum: {
        select: {
          id: true,
          imageUrl: true,
          hash: true,
          user: { select: { username: true } },
        },
      },
    },
  });
  if (!report) {
    return { success: false as const, error: "This report does not exist." };
  }

  if (decision === "dismiss") {
    await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
    revalidatePath("/admin/reports");
    return { success: true as const };
  }

  if (decision === "hide") {
    await prisma.$transaction([
      prisma.platinum.update({
        where: { id: report.platinumId },
        data: { moderationStatus: "HIDDEN" },
      }),
      prisma.report.updateMany({
        where: { platinumId: report.platinumId },
        data: { status: "ACTIONED" },
      }),
    ]);
    revalidateVotePaths(report.platinumId, report.platinum.user.username);
    revalidatePath("/admin/reports");
    return { success: true as const };
  }

  await removePlatinumRecord(report.platinum, report.platinum.user.username);
  revalidatePath("/admin/reports");
  return { success: true as const };
}

/** Direct visibility flip from the moderation board (restore / take down). */
export async function setPlatinumModeration(
  platinumId: string,
  status: "PUBLISHED" | "HIDDEN",
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }
  if (!(await isModerator(userId))) {
    return { success: false as const, error: "You don't have permission to moderate." };
  }
  if (!checkRateLimit(`moderate:${userId}`, 60, 60_000).ok) {
    return { success: false as const, error: "Slow down a moment and try again." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: { user: { select: { username: true } } },
  });
  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }

  if (status === "HIDDEN") {
    await prisma.$transaction([
      prisma.platinum.update({ where: { id: platinumId }, data: { moderationStatus: "HIDDEN" } }),
      prisma.report.updateMany({
        where: { platinumId, status: "OPEN" },
        data: { status: "ACTIONED" },
      }),
    ]);
  } else {
    await prisma.platinum.update({
      where: { id: platinumId },
      data: { moderationStatus: "PUBLISHED" },
    });
  }

  revalidateVotePaths(platinumId, platinum.user.username);
  revalidatePath("/admin/reports");
  return { success: true as const };
}

export async function reportPlatinum(
  platinumId: string,
  input: { reason: string; message?: string },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in to report a platinum." };
  }
  if (!checkRateLimit(`report:${userId}`, 10, 60_000).ok) {
    return {
      success: false as const,
      error: "That is a lot of reports at once. Please wait a moment and try again.",
    };
  }

  const parsed = reportSchema.safeParse({
    reason: input.reason,
    message: input.message || undefined,
  });
  if (!parsed.success) {
    return { success: false as const, error: "Pick a reason for the report." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: { userId: true },
  });
  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }
  if (platinum.userId === userId) {
    return { success: false as const, error: "You can't report your own platinum." };
  }

  // One report per user per plate: re-reporting refreshes the existing row.
  await prisma.report.upsert({
    where: { userId_platinumId: { userId, platinumId } },
    create: {
      userId,
      platinumId,
      reason: parsed.data.reason,
      message: parsed.data.message ?? null,
    },
    update: {
      reason: parsed.data.reason,
      message: parsed.data.message ?? null,
      status: "OPEN",
    },
  });

  // TODO(Tanda 3): run the AI triage for this plate's image hash.
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

  const voteLimit = checkRateLimit(`vote:${userId}`, 20, 60_000);
  if (!voteLimit.ok) {
    return {
      success: false,
      error: "That is a lot of votes at once. Please wait a moment and try again.",
    };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: {
      userId: true,
      moderationStatus: true,
      user: { select: { username: true } },
    },
  });

  if (!platinum) {
    return { success: false, error: "This platinum does not exist." };
  }
  if (platinum.moderationStatus !== "PUBLISHED") {
    return {
      success: false,
      error: "This platinum is under review and can't be voted on.",
    };
  }
  if (platinum.userId === userId) {
    return {
      success: false,
      error: "You can't vote for your own platinum.",
    };
  }

  const period = getCurrentPeriod();

  // A new calendar month starts a fresh race: freeze the month that just
  // closed the first time anyone touches voting. Best-effort on purpose — a
  // snapshot failure must never break the vote itself.
  try {
    await ensureSnapshots();
  } catch {
    // Ignored: the next vote (or the backfill script) will retry.
  }

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
