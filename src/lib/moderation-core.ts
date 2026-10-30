import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/b2';
import { notifyUser } from '@/lib/notifications';
import { strikesAfterRestore } from '@/lib/moderation-policy';

const IMAGE_URL_PREFIX = '/api/images/';
const STORED_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

/**
 * `revalidatePath` throws outside a Next request context (e.g. the Telegram
 * long-polling loop). Purging the cache is best-effort there: the DB write has
 * already happened and the dynamic pages re-render on the next request, so we
 * log and carry on instead of failing the whole moderation action.
 */
function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch (error) {
    console.warn(`[moderation] revalidatePath("${path}") skipped`, error);
  }
}

export function imageKeyFromUrl(imageUrl: string): string | null {
  if (!imageUrl.startsWith(IMAGE_URL_PREFIX)) return null;
  const key = imageUrl.slice(IMAGE_URL_PREFIX.length);
  return STORED_KEY_PATTERN.test(key) ? key : null;
}

export type ModerationResult =
  | { success: true }
  | { success: false; error: string };

interface FlaggedPlate {
  id: string;
  hash: string;
  gameName: string;
  userId: string;
}

/**
 * Confirms a plate as disallowed: flags its bytes so a re-upload is caught on
 * arrival, adds one strike to the owner and drops them an in-app notice.
 */
async function recordConfirmedHit(plate: FlaggedPlate, reason: string) {
  await prisma.flaggedHash.upsert({
    where: { hash: plate.hash },
    create: { hash: plate.hash, reason },
    update: { reason },
  });

  const owner = await prisma.user.update({
    where: { id: plate.userId },
    data: { strikes: { increment: 1 } },
    select: { strikes: true },
  });

  await notifyUser({
    userId: plate.userId,
    kind: 'PLATE_HIDDEN',
    title: `“${plate.gameName}” was taken down`,
    body: `${reason} You can appeal from the platinum page if you think this is a mistake.`,
    platinumId: plate.id,
  });

  return owner.strikes;
}

/**
 * Public entry point for the upload flow: the AI auto-hid a plate, so flag its
 * bytes and strike the owner through the same path a moderator take-down uses.
 */
export async function confirmPlateAsBad(
  platinumId: string,
  reason: string,
): Promise<void> {
  const plate = await prisma.platinum.findUnique({
    where: { id: platinumId },
    select: { id: true, hash: true, gameName: true, userId: true },
  });
  if (!plate) return;
  await recordConfirmedHit(plate, reason);
}

/**
 * Clearing a plate wipes one strike (never below zero) and closes any appeal it
 * had open, so a user who cleans up their act climbs back out of the ladder.
 */
async function recordRestore(plate: FlaggedPlate) {
  const owner = await prisma.user.findUnique({
    where: { id: plate.userId },
    select: { strikes: true },
  });
  if (owner && owner.strikes > 0) {
    await prisma.user.update({
      where: { id: plate.userId },
      data: { strikes: strikesAfterRestore(owner.strikes) },
    });
  }
  await prisma.report.updateMany({
    where: { platinumId: plate.id, reason: 'APPEAL', status: 'OPEN' },
    data: { status: 'ACTIONED' },
  });
  await notifyUser({
    userId: plate.userId,
    kind: 'APPEAL_RESOLVED',
    title: `“${plate.gameName}” is public again`,
    body: 'A moderator restored your platinum.',
    platinumId: plate.id,
  });
}

export function revalidateVotePaths(
  platinumId: string,
  ownerUsername?: string | null,
) {
  safeRevalidate('/');
  safeRevalidate('/explore');
  safeRevalidate('/hall-of-fame');
  safeRevalidate(`/platinum/${platinumId}`);
  if (ownerUsername) {
    safeRevalidate(`/u/${ownerUsername}`);
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

  safeRevalidate('/');
  safeRevalidate('/explore');
  safeRevalidate('/hall-of-fame');
  safeRevalidate(`/platinum/${platinum.id}`);
  if (ownerUsername) {
    safeRevalidate(`/u/${ownerUsername}`);
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
          gameName: true,
          imageUrl: true,
          hash: true,
          userId: true,
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
    safeRevalidate('/admin/reports');
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
    await recordConfirmedHit(
      report.platinum,
      'A moderator confirmed it breaks the content rules.',
    );
    revalidateVotePaths(report.platinumId, report.platinum.user.username);
    safeRevalidate('/admin/reports');
    return { success: true };
  }

  await recordConfirmedHit(
    report.platinum,
    'A moderator removed it for breaking the content rules.',
  );
  await removePlatinumRecord(report.platinum, report.platinum.user.username);
  safeRevalidate('/admin/reports');
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
      gameName: true,
      imageUrl: true,
      hash: true,
      userId: true,
      user: { select: { username: true } },
    },
  });
  if (!platinum) {
    return { success: false, error: 'This platinum does not exist.' };
  }

  if (op === 'DELETE') {
    await recordConfirmedHit(
      platinum,
      'A moderator removed it for breaking the content rules.',
    );
    await removePlatinumRecord(platinum, platinum.user.username);
    safeRevalidate('/admin/reports');
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
    await recordConfirmedHit(
      platinum,
      'A moderator confirmed it breaks the content rules.',
    );
  } else {
    await prisma.platinum.update({
      where: { id: platinumId },
      data: { moderationStatus: 'PUBLISHED' },
    });
    await recordRestore(platinum);
  }

  revalidateVotePaths(platinumId, platinum.user.username);
  safeRevalidate('/admin/reports');
  return { success: true };
}
