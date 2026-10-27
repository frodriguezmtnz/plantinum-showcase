'use server';

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import sharp from "sharp";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getFollowingFeedPage,
  getPlatinumsPage,
  getProfileGalleryItems,
  getUserByUsername,
  PLATINUMS_PAGE_SIZE,
  countUploadsInCurrentPeriod,
} from "@/lib/data";
import { getCurrentPeriod } from "@/lib/period";
import {
  parseProfilePlatform,
  parseProfileSort,
} from "@/lib/profile-gallery";
import { ensureSnapshots } from "@/lib/history";
import { isStorageConfigured, putImage, storageImageKey } from "@/lib/b2";
import { encodePlate } from "@/lib/watermark";
import { checkRateLimit } from "@/lib/rate-limit";
import { detectImageType } from "@/lib/image-signature";
import { planConfig, quotaReached, nextPlan, uploadsRemaining } from "@/lib/plans";
import { platinumMetaInputSchema, reportSchema, watermarkPositionSchema } from "@/lib/schemas";
import { buildImageHint } from "@/lib/image-hint";
import { isModerator } from "@/lib/roles";
import { getAiTriageConfig, isAiTriageConfigured, triageImageHash } from "@/lib/ai-triage";
import { moderationStatusForVerdict } from "@/lib/ai-verdict";
import { applyStrikePolicy, isUploadBlocked } from "@/lib/moderation-policy";
import {
  countUnreadNotifications,
  markNotificationsRead,
  notifyModerators,
  notifyUser,
} from "@/lib/notifications";
import {
  FOLLOW_PAGE_SIZE,
  getFollowersPage,
  getFollowingPage,
} from "@/lib/follows";
import { REPORT_REASON_LABELS } from "@/lib/report-labels";
import { sendModerationNotice } from "@/lib/telegram";
import {
  applyPlatinumModeration,
  applyReportDecision,
  confirmPlateAsBad,
  removePlatinumRecord,
  revalidateVotePaths,
  type ModerationDecision,
  type PlatinumModerationOp,
} from "@/lib/moderation-core";

export type { ModerationDecision, PlatinumModerationOp } from "@/lib/moderation-core";

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

/**
 * Post-upload AI screening. The plate is created as UNDER_REVIEW, so it is never
 * public until cleared: only an explicit SAFE verdict publishes it, while
 * REVIEW, UNSAFE or any classifier failure (refusal, timeout, unparseable) keeps
 * it under review and alerts the moderator. Never downgrades a moderator.
 */
async function screenPlatinumUpload(
  platinumId: string,
  hash: string,
  gameName: string,
  data: Buffer,
) {
  try {
    const { verdict, isNew } = await triageImageHash({
      hash,
      data,
      mimeType: "image/avif",
      gameName,
    });

    if (!verdict) {
      // Fail closed: without a verdict the plate stays UNDER_REVIEW.
      console.warn(
        "[ai-triage] no verdict for upload; leaving plate under review",
        platinumId,
      );
      return;
    }

    const owner = await prisma.platinum.findUnique({
      where: { id: platinumId },
      select: { user: { select: { id: true, username: true, strikes: true } } },
    });
    const strikes = owner?.user.strikes ?? 0;

    // A user already on the escalation ladder never auto-publishes, however
    // confident the classifier is.
    const status = applyStrikePolicy(
      moderationStatusForVerdict(
        verdict,
        getAiTriageConfig()?.autoHideUnsafe ?? false,
      ),
      strikes,
    );

    const updated = await prisma.platinum.updateMany({
      where: { id: platinumId, moderationStatus: "UNDER_REVIEW" },
      data: { moderationStatus: status },
    });
    if (updated.count === 0) return;

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/hall-of-fame");

    if (status === "HIDDEN") {
      await confirmPlateAsBad(
        platinumId,
        verdict.summary ??
          "The content classifier marked this image as disallowed.",
      );
    }

    if (status === "PUBLISHED") return;

    // The moderator queue also gets an in-app notice, mirroring the chat ping.
    await notifyModerators({
      kind: "PLATE_FLAGGED",
      title: `“${gameName}” flagged by the AI`,
      body: [
        verdict.label,
        verdict.category,
        verdict.confidence != null
          ? `${Math.round(verdict.confidence * 100)}%`
          : null,
        verdict.summary,
      ]
        .filter(Boolean)
        .join(" · "),
      platinumId,
    });

    if (isNew) {
      await sendModerationNotice({
        source: "upload",
        platinumId,
        gameName,
        ownerUsername: owner?.user.username ?? null,
        label: verdict.label,
        category: verdict.category,
        confidence: verdict.confidence,
        summary: verdict.summary,
        moderationStatus: status,
      });
    }
  } catch (error) {
    console.warn("[upload] ai screening failed", error);
  }
}

/**
 * Fail-closed fallback for when no AI screener is configured: the plate was
 * created as UNDER_REVIEW but there is no verdict, so we ask a moderator to
 * decide by hand instead of leaving it silently stuck in the queue.
 */
async function notifyManualReview(platinumId: string, gameName: string) {
  try {
    const owner = await prisma.platinum.findUnique({
      where: { id: platinumId },
      select: { user: { select: { username: true } } },
    });
    await sendModerationNotice({
      source: "upload",
      platinumId,
      gameName,
      ownerUsername: owner?.user.username ?? null,
      label: "REVIEW",
      category: null,
      confidence: null,
      summary: "AI screening is not configured; manual review required.",
      moderationStatus: "UNDER_REVIEW",
      manual: true,
    });
    await notifyModerators({
      kind: "PLATE_FLAGGED",
      title: `“${gameName}” needs a manual review`,
      body: "AI screening is not configured, so a human has to decide.",
      platinumId,
    });
  } catch (error) {
    console.warn("[upload] manual review notice failed", error);
  }
}

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

  const uploadLimit = await checkRateLimit(`upload:${userId}`, 10, 60 * 60_000);
  if (!uploadLimit.ok) {
    return {
      success: false as const,
      error: "Too many uploads in a short time. Please wait a bit and try again.",
    };
  }

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, strikes: true },
  });

  // Repeat offenders stop being able to upload at all once they hit the top of
  // the escalation ladder.
  if (isUploadBlocked(account?.strikes ?? 0)) {
    return {
      success: false as const,
      error:
        "Your account is blocked from uploading after repeated content violations. Contact the moderators if you believe this is a mistake.",
    };
  }

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
  const screeningEnabled = isAiTriageConfigured();

  // Content-addressed bytes a moderator already confirmed as disallowed bypass
  // the classifier entirely: they never go public, not even briefly.
  const flagged = await prisma.flaggedHash.findUnique({
    where: { hash },
    select: { reason: true },
  });

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
        // Fail-closed: a plate is never public at creation. Only an explicit
        // SAFE verdict publishes it (screening below); otherwise, including when
        // the AI is not configured at all, a human decides.
        moderationStatus: flagged ? "HIDDEN" : "UNDER_REVIEW",
      },
    });

    revalidatePath("/");
    revalidatePath("/explore");
    revalidatePath("/hall-of-fame");

    if (flagged) {
      const reason = flagged.reason ?? "This image was flagged by a moderator.";
      await confirmPlateAsBad(platinum.id, reason);
      await sendModerationNotice({
        source: "upload",
        platinumId: platinum.id,
        gameName: platinum.gameName,
        ownerUsername: session.user?.name ?? null,
        label: "UNSAFE",
        category: "repeat",
        confidence: null,
        summary: `Re-upload of a flagged screenshot. ${reason}`,
        moderationStatus: "HIDDEN",
      });
      await notifyModerators({
        kind: "PLATE_FLAGGED",
        title: `“${platinum.gameName}” re-uploaded a flagged screenshot`,
        body: "Content-addressed match against the disallowed list; taken down on arrival.",
        platinumId: platinum.id,
      });
      return {
        success: true as const,
        platinumId: platinum.id,
        moderationStatus: "HIDDEN" as const,
      };
    }

    if (screeningEnabled) {
      after(() =>
        screenPlatinumUpload(platinum.id, hash, platinum.gameName, processed.data),
      );
    } else {
      after(() => notifyManualReview(platinum.id, platinum.gameName));
      if (process.env.NODE_ENV !== "production") {
        console.info(
          "[ai-triage] upload screening skipped: NAN_API_KEY is not set (restart dev after editing .env). Manual review required.",
        );
      }
    }

    return {
      success: true as const,
      platinumId: platinum.id,
      moderationStatus: "UNDER_REVIEW" as const,
    };
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

  const editLimit = await checkRateLimit(`edit:${userId}`, 20, 60 * 60_000);
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
  if (!(await checkRateLimit(`moderate:${userId}`, 60, 60_000)).ok) {
    return { success: false as const, error: "Slow down a moment and try again." };
  }
  return applyReportDecision(reportId, decision);
}

/** Direct moderation from the board (restore / take down / delete). */
export async function moderatePlatinum(
  platinumId: string,
  op: PlatinumModerationOp,
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in." };
  }
  if (!(await isModerator(userId))) {
    return { success: false as const, error: "You don't have permission to moderate." };
  }
  if (!(await checkRateLimit(`moderate:${userId}`, 60, 60_000)).ok) {
    return { success: false as const, error: "Slow down a moment and try again." };
  }
  return applyPlatinumModeration(platinumId, op);
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
  if (!(await checkRateLimit(`report:${userId}`, 10, 60_000)).ok) {
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
    select: {
      userId: true,
      hash: true,
      gameName: true,
      moderationStatus: true,
      user: { select: { username: true } },
    },
  });
  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }
  if (platinum.userId === userId) {
    return { success: false as const, error: "You can't report your own platinum." };
  }

  // One open report per user per plate. While a report is still OPEN the user
  // cannot file another; a dismissed or actioned report can be reopened later.
  const existing = await prisma.report.findUnique({
    where: { userId_platinumId: { userId, platinumId } },
    select: { status: true },
  });
  if (existing?.status === "OPEN") {
    return {
      success: false as const,
      error: "You already reported this platinum. A moderator is on it.",
    };
  }

  const reportData = {
    reason: parsed.data.reason,
    message: parsed.data.message ?? null,
    status: "OPEN" as const,
  };

  let reportId: string;
  if (existing) {
    const updated = await prisma.report.update({
      where: { userId_platinumId: { userId, platinumId } },
      data: reportData,
    });
    reportId = updated.id;
  } else {
    try {
      const created = await prisma.report.create({
        data: { userId, platinumId, ...reportData },
      });
      reportId = created.id;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        return {
          success: false as const,
          error: "You already reported this platinum.",
        };
      }
      throw error;
    }
  }

  // Triage of the reported plate: reuse the upload verdict if it is cached,
  // otherwise classify once and alert the moderator chat.
  await notifyModerators({
    kind: "REPORT_RECEIVED",
    title: `New report on “${platinum.gameName}”`,
    body: [
      REPORT_REASON_LABELS[parsed.data.reason],
      parsed.data.message ?? null,
      session.user.name ? `— @${session.user.name}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    platinumId,
  });

  if (isAiTriageConfigured()) {
    after(async () => {
      try {
        const { verdict, isNew } = await triageImageHash({
          hash: platinum.hash,
          gameName: platinum.gameName,
        });
        if (!isNew || !verdict || verdict.label === "SAFE") return;

        await sendModerationNotice({
          source: "report",
          platinumId,
          gameName: platinum.gameName,
          ownerUsername: platinum.user.username,
          label: verdict.label,
          category: verdict.category,
          confidence: verdict.confidence,
          summary: verdict.summary,
          moderationStatus:
            platinum.moderationStatus === "HIDDEN" ? "HIDDEN" : "UNDER_REVIEW",
          reportId,
          reportReason: parsed.data.reason,
          reportMessage: parsed.data.message ?? null,
          reporterUsername: session.user.name ?? null,
        });
      } catch (error) {
        console.warn("[report] ai triage failed", error);
      }
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.info("[ai-triage] report triage skipped: NAN_API_KEY is not set.");
  }

  return { success: true as const };
}

export async function withdrawReport(platinumId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in to withdraw a report." };
  }
  if (!(await checkRateLimit(`report:${userId}`, 10, 60_000)).ok) {
    return {
      success: false as const,
      error: "That is a lot of reports at once. Please wait a moment and try again.",
    };
  }

  const report = await prisma.report.findUnique({
    where: { userId_platinumId: { userId, platinumId } },
    select: { id: true, status: true },
  });
  if (!report) {
    return { success: false as const, error: "You have no report on this platinum." };
  }
  if (report.status !== "OPEN") {
    return {
      success: false as const,
      error: "Only reports waiting for review can be withdrawn.",
    };
  }

  await prisma.report.delete({ where: { id: report.id } });
  revalidatePath(`/platinum/${platinumId}`);
  revalidatePath("/admin/reports");
  return { success: true as const };
}

/**
 * Owner appeal for a plate moderation took down. It rides the existing report
 * pipeline (reason APPEAL) so it lands in the same moderator queue, and pings
 * the chat with the restore/hide/delete buttons.
 */
export async function appealPlatinum(platinumId: string, message: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false as const, error: "You need to sign in to appeal." };
  }
  if (!(await checkRateLimit(`appeal:${userId}`, 5, 60 * 60_000)).ok) {
    return {
      success: false as const,
      error: "That is a lot of appeals at once. Please wait a moment.",
    };
  }

  const trimmed = message.trim();
  if (trimmed.length < 10) {
    return {
      success: false as const,
      error: "Tell the moderators a little more (at least 10 characters).",
    };
  }
  if (trimmed.length > 500) {
    return { success: false as const, error: "Your appeal is too long." };
  }

  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: {
      id: true,
      userId: true,
      gameName: true,
      moderationStatus: true,
      user: { select: { username: true } },
    },
  });
  if (!platinum) {
    return { success: false as const, error: "This platinum does not exist." };
  }
  if (platinum.userId !== userId) {
    return { success: false as const, error: "You can only appeal your own platinum." };
  }
  if (platinum.moderationStatus === "PUBLISHED") {
    return { success: false as const, error: "This platinum is already public." };
  }

  const existing = await prisma.report.findUnique({
    where: { userId_platinumId: { userId, platinumId } },
    select: { id: true, status: true },
  });
  if (existing?.status === "OPEN") {
    return {
      success: false as const,
      error: "You already have an appeal open. A moderator is on it.",
    };
  }

  const reportData = {
    reason: "APPEAL" as const,
    message: trimmed,
    status: "OPEN" as const,
  };

  let reportId: string;
  if (existing) {
    const updated = await prisma.report.update({
      where: { userId_platinumId: { userId, platinumId } },
      data: reportData,
    });
    reportId = updated.id;
  } else {
    const created = await prisma.report.create({
      data: { userId, platinumId, ...reportData },
    });
    reportId = created.id;
  }

  await sendModerationNotice({
    source: "appeal",
    platinumId,
    gameName: platinum.gameName,
    ownerUsername: platinum.user.username,
    label: "REVIEW",
    category: "appeal",
    confidence: null,
    summary: `Owner appeal: ${trimmed}`,
    moderationStatus:
      platinum.moderationStatus === "HIDDEN" ? "HIDDEN" : "UNDER_REVIEW",
    reportId,
    reportReason: "APPEAL",
    reportMessage: trimmed,
    reporterUsername: platinum.user.username,
  });

  await notifyModerators({
    kind: "APPEAL_RECEIVED",
    title: `“${platinum.gameName}” — appeal from @${platinum.user.username}`,
    body: trimmed,
    platinumId,
  });

  revalidatePath(`/platinum/${platinumId}`);
  revalidatePath("/admin/reports");
  return { success: true as const };
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;
  await markNotificationsRead(userId);
  revalidatePath("/notifications");
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return 0;
  return countUnreadNotifications(userId);
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

export async function getMoreFollowingPlatinums(options: {
  q?: string;
  platform?: string;
  sort?: string;
  offset?: number;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { items: [], hasMore: false };

  return getFollowingFeedPage({
    ...options,
    followerId: userId,
    currentUserId: userId,
    limit: PLATINUMS_PAGE_SIZE,
  });
}

export async function getMoreProfilePlatinums(options: {
  username: string;
  platform?: string;
  sort?: string;
  offset?: number;
}) {
  const session = await auth();
  const user = await getUserByUsername(options.username);
  if (!user) return { items: [], total: 0, hasMore: false };

  return getProfileGalleryItems({
    userId: user.id,
    currentUserId: session?.user?.id,
    platform: parseProfilePlatform(options.platform),
    sort: parseProfileSort(options.sort),
    offset: options.offset ?? 0,
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

  const voteLimit = await checkRateLimit(`vote:${userId}`, 20, 60_000);
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

export type FollowActionResult =
  | { success: true; isFollowing: boolean; followers: number }
  | { success: false; error: string };

/**
 * Follow / unfollow another hunter. Idempotent: a double click can only flip
 * the single edge guarded by `@@unique([followerId, followingId])`.
 */
export async function toggleFollow(username: string): Promise<FollowActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { success: false, error: "You need to sign in to follow hunters." };
  }

  const followLimit = await checkRateLimit(`follow:${userId}`, 30, 60_000);
  if (!followLimit.ok) {
    return {
      success: false,
      error: "That is a lot of follows at once. Please wait a moment and try again.",
    };
  }

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true },
  });
  if (!target || !target.username) {
    return { success: false, error: "This hunter does not exist." };
  }
  if (target.id === userId) {
    return { success: false, error: "You can't follow yourself." };
  }

  const edge = { followerId: userId, followingId: target.id };

  try {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: edge },
      select: { id: true },
    });

    let isFollowing: boolean;
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      isFollowing = false;
    } else {
      await prisma.follow.create({ data: edge });
      isFollowing = true;

      // Best-effort: a failed notice must never undo the follow itself.
      const follower = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      if (follower?.username) {
        await notifyUser({
          userId: target.id,
          kind: "NEW_FOLLOWER",
          title: `@${follower.username} started following you`,
          body: "Open their profile to see their platinum shelf.",
          linkUrl: `/u/${follower.username}`,
        });
      }
    }

    const followers = await prisma.follow.count({
      where: { followingId: target.id },
    });

    revalidatePath(`/u/${target.username}`);
    return { success: true, isFollowing, followers };
  } catch (error) {
    const code = (error as { code?: string }).code;
    // Two concurrent follows: the unique index already recorded this edge.
    if (code === "P2002") {
      const followers = await prisma.follow.count({
        where: { followingId: target.id },
      });
      return { success: true, isFollowing: true, followers };
    }
    // Two concurrent unfollows: the row is already gone.
    if (code === "P2025") {
      const followers = await prisma.follow.count({
        where: { followingId: target.id },
      });
      return { success: true, isFollowing: false, followers };
    }

    console.error("[follows] could not toggle follow", error);
    return {
      success: false,
      error: "Could not update the follow. Please try again.",
    };
  }
}

export async function getMoreFollowers(options: {
  username: string;
  offset?: number;
}) {
  const session = await auth();
  const user = await getUserByUsername(options.username);
  if (!user) return { items: [], total: 0, hasMore: false };

  return getFollowersPage(user.id, {
    offset: options.offset ?? 0,
    limit: FOLLOW_PAGE_SIZE,
    viewerId: session?.user?.id,
  });
}

export async function getMoreFollowing(options: {
  username: string;
  offset?: number;
}) {
  const session = await auth();
  const user = await getUserByUsername(options.username);
  if (!user) return { items: [], total: 0, hasMore: false };

  return getFollowingPage(user.id, {
    offset: options.offset ?? 0,
    limit: FOLLOW_PAGE_SIZE,
    viewerId: session?.user?.id,
  });
}
