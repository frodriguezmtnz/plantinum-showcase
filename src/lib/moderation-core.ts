import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/b2';

const IMAGE_URL_PREFIX = '/api/images/';
const STORED_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

function imageKeyFromUrl(imageUrl: string): string | null {
  if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = imageUrl.slice(IMAGE_URL_PREFIX.length);
  return STORED_KEY_PATTERN.test(key) ? key : null;
}

export type ModerationResult =
  | { success: true }
  | { success: false; error: string };

export function revalidateVotePaths(
  platinumId: string,
  ownerUsername?: string | null,
) {
  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/hall-of-fame');
  revalidatePath(`/platinum/${platinumId}`);
  if (ownerUsername) {
    revalidatePath(`/u/${ownerUsername}`);
  }
}

/** Shared removal: cuts the frozen link, drops the row and cleans up B2. */
export async function removePlatinumRecord(
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

  revalidatePath('/');
  revalidatePath('/explore');
  revalidatePath('/hall-of-fame');
  revalidatePath(`/platinum/${platinum.id}`);
  if (ownerUsername) {
    revalidatePath(`/u/${ownerUsername}`);
  }
}

export type ModerationDecision = 'dismiss' | 'hide' | 'delete';

/**
 * Applies a moderator's decision on an open report. Authorization lives in the
 * caller (server action or the Telegram webhook), not here.
 */
export async function applyReportDecision(
  reportId: string,
  decision: ModerationDecision,
): Promise<ModerationResult> {
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
    return { success: false, error: 'This report does not exist.' };
  }

  if (decision === 'dismiss') {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED' },
    });
    revalidatePath('/admin/reports');
    return { success: true };
  }

  if (decision === 'hide') {
    await prisma.$transaction([
      prisma.platinum.update({
        where: { id: report.platinumId },
        data: { moderationStatus: 'HIDDEN' },
      }),
      prisma.report.updateMany({
        where: { platinumId: report.platinumId },
        data: { status: 'ACTIONED' },
      }),
    ]);
    revalidateVotePaths(report.platinumId, report.platinum.user.username);
    revalidatePath('/admin/reports');
    return { success: true };
  }

  await removePlatinumRecord(report.platinum, report.platinum.user.username);
  revalidatePath('/admin/reports');
  return { success: true };
}

export type PlatinumModerationOp = 'PUBLISHED' | 'HIDDEN' | 'DELETE';

/** Direct moderation of a plate (restore / take down / delete). */
export async function applyPlatinumModeration(
  platinumId: string,
  op: PlatinumModerationOp,
): Promise<ModerationResult> {
  const platinum = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: {
      id: true,
      imageUrl: true,
      hash: true,
      user: { select: { username: true } },
    },
  });
  if (!platinum) {
    return { success: false, error: 'This platinum does not exist.' };
  }

  if (op === 'DELETE') {
    await removePlatinumRecord(platinum, platinum.user.username);
    revalidatePath('/admin/reports');
    return { success: true };
  }

  if (op === 'HIDDEN') {
    await prisma.$transaction([
      prisma.platinum.update({
        where: { id: platinumId },
        data: { moderationStatus: 'HIDDEN' },
      }),
      prisma.report.updateMany({
        where: { platinumId, status: 'OPEN' },
        data: { status: 'ACTIONED' },
      }),
    ]);
  } else {
    await prisma.platinum.update({
      where: { id: platinumId },
      data: { moderationStatus: 'PUBLISHED' },
    });
  }

  revalidateVotePaths(platinumId, platinum.user.username);
  revalidatePath('/admin/reports');
  return { success: true };
}
