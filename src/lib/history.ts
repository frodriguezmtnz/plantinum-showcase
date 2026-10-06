import { prisma } from '@/lib/prisma';
import { getCurrentPeriod } from '@/lib/period';

/**
 * Per-period history, built on the immutable `Vote` ledger.
 *
 * `Platinum.monthlyVotes` / `monthlyVotesMonth` are only a cache of the latest
 * period; the `Vote` table keeps a `period` on every row, which makes it the
 * real source of a month's standings. When a month closes we freeze those
 * standings into `MonthlyResult` so later edits, un-votes or deletions cannot
 * rewrite history.
 */

export interface ArchivedEntry {
  /** Stable key for lists — the platinum id the row still points at. */
  id: string;
  platinumId: string;
  gameName: string;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
  platform: string;
  isSpoiler: boolean;
  username: string;
  avatarUrl: string;
  votes: number;
  rank: number;
}

export interface ClosedRanking {
  period: string;
  entries: ArchivedEntry[];
}

interface RankingRow {
  period: string;
  rank: number;
  votes: number;
  platinumId: string;
  gameName: string;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
  platform: string;
  isSpoiler: boolean;
  username: string;
  avatarUrl: string;
}

const AVATAR_FALLBACK = (userId: string) => `https://i.pravatar.cc/150?u=${userId}`;

/** The final standings of a single period, aggregated from the live votes. */
async function buildPeriodRanking(period: string): Promise<RankingRow[]> {
  const grouped = await prisma.vote.groupBy({
    by: ['platinumId'],
    where: { period },
    _count: { platinumId: true },
  });

  if (grouped.length === 0) return [];

  const ordered = [...grouped].sort((a, b) => {
    const diff = b._count.platinumId - a._count.platinumId;
    return diff !== 0 ? diff : a.platinumId.localeCompare(b.platinumId);
  });

  const platinums = await prisma.platinum.findMany({
    where: {
      moderationStatus: 'PUBLISHED',
      id: { in: ordered.map((row) => row.platinumId) },
    },
    include: { user: true },
  });
  const byId = new Map(platinums.map((platinum) => [platinum.id, platinum]));

  const rows: RankingRow[] = [];
  for (const group of ordered) {
    const platinum = byId.get(group.platinumId);
    // A deleted plate cascades its votes away, but never guess if one is missing.
    if (!platinum) continue;
    rows.push({
      period,
      rank: rows.length + 1,
      votes: group._count.platinumId,
      platinumId: platinum.id,
      gameName: platinum.gameName,
      imageUrl: platinum.imageUrl,
      imageHint: platinum.imageHint,
      width: platinum.width,
      height: platinum.height,
      platform: platinum.platform,
      isSpoiler: platinum.isSpoiler,
      username: platinum.user.username ?? 'Unknown',
      avatarUrl: platinum.user.image ?? AVATAR_FALLBACK(platinum.user.id),
    });
  }
  return rows;
}

/**
 * Freeze every closed period that still lacks a snapshot. Idempotent: the
 * `@@unique([period, rank])` plus `skipDuplicates` make concurrent callers safe.
 * Best-effort callers should swallow failures — this must never block a vote.
 */
export async function ensureSnapshots(now: Date = new Date()): Promise<number> {
  const current = getCurrentPeriod(now);

  const [votePeriods, snapshotPeriods] = await Promise.all([
    prisma.vote.findMany({
      where: { period: { lt: current } },
      distinct: ['period'],
      select: { period: true },
    }),
    prisma.monthlyResult.findMany({
      distinct: ['period'],
      select: { period: true },
    }),
  ]);

  const frozen = new Set(snapshotPeriods.map((row) => row.period));
  const pending = votePeriods
    .map((row) => row.period)
    .filter((period) => !frozen.has(period));

  let created = 0;
  for (const period of pending) {
    const rows = await buildPeriodRanking(period);
    if (rows.length === 0) continue;
    const result = await prisma.monthlyResult.createMany({
      data: rows,
      skipDuplicates: true,
    });
    created += result.count;
  }
  return created;
}

function toArchivedEntry(row: RankingRow): ArchivedEntry {
  return { id: row.platinumId, ...row };
}

/** Every closed period we hold a frozen snapshot for, newest first. */
export async function getArchivedPeriods(): Promise<string[]> {
  const rows = await prisma.monthlyResult.findMany({
    distinct: ['period'],
    select: { period: true },
    orderBy: { period: 'desc' },
  });
  return rows.map((row) => row.period);
}

/** The frozen standings of a given period, falling back to live votes. */
export async function getArchivedRanking(
  period: string,
  limit = 12,
): Promise<ClosedRanking> {
  const frozen = await prisma.monthlyResult.findMany({
    where: { period },
    orderBy: { rank: 'asc' },
    take: limit,
  });

  if (frozen.length > 0) {
    return {
      period,
      // A plate deleted after the month closed loses its image too, so rows
      // without a live platinum are not displayable — skip them, keep the
      // rest at their frozen ranks.
      entries: frozen
        .filter((row) => row.platinumId !== null)
        .map((row) =>
          toArchivedEntry({
            period: row.period,
            rank: row.rank,
            votes: row.votes,
            platinumId: row.platinumId!,
            gameName: row.gameName,
            imageUrl: row.imageUrl,
            imageHint: row.imageHint,
            width: row.width,
            height: row.height,
            platform: row.platform,
            isSpoiler: row.isSpoiler,
            username: row.username,
            avatarUrl: row.avatarUrl,
          }),
        ),
    };
  }

  const live = (await buildPeriodRanking(period)).slice(0, limit);
  return { period, entries: live.map(toArchivedEntry) };
}

/**
 * The most recent closed month that actually saw votes, or null when the
 * community has no completed race yet. Used to keep the home populated at the
 * start of a fresh month without ever inventing a standing.
 */
export async function getLatestClosedRanking(
  limit = 12,
  now: Date = new Date(),
): Promise<ClosedRanking | null> {
  const current = getCurrentPeriod(now);
  const periods = await prisma.vote.findMany({
    where: { period: { lt: current } },
    distinct: ['period'],
    select: { period: true },
    orderBy: { period: 'desc' },
  });

  const latest = periods[0]?.period;
  if (!latest) return null;
  return getArchivedRanking(latest, limit);
}
