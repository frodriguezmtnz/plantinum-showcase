import { prisma } from '@/lib/prisma';
import { getCurrentPeriod } from '@/lib/period';
import { generatedAvatarUrl } from '@/lib/generated-avatar';
import { Prisma } from '@/generated/prisma/client';

/**
 * Hunter-level standings for the monthly race.
 *
 * The Hall of Fame ranks plates; this board ranks the people behind them by the
 * votes their published platinums earned during the current Europe/Madrid
 * month. `Platinum.monthlyVotes` is the per-plate cache of `Vote.period`, so a
 * single grouped pass over the board is enough (no need to walk the vote
 * ledger). Ordering is fully deterministic so ties never reshuffle between
 * requests: monthly votes → all-time votes → plates → user id.
 */

export const HUNTER_BOARD_SIZE = 25;

export type HunterBoardScope = 'global' | 'circle';

export interface HunterLeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string;
  rank: number;
  /** Votes received this month across the hunter's published platinums. */
  monthlyVotes: number;
  /** All-time votes on the plates that earned votes this month (tie-breaker). */
  totalVotes: number;
  /** Published platinums that received at least one vote this month. */
  plates: number;
}

export interface HunterLeaderboard {
  items: HunterLeaderboardEntry[];
  /** Hunters on the board (voted plates this month), after scope filtering. */
  total: number;
  hasMore: boolean;
}

export interface HunterStanding {
  rank: number;
  total: number;
  monthlyVotes: number;
  plates: number;
}

interface HunterRow {
  id: string;
  username: string;
  image: string | null;
  monthly_votes: number;
  total_votes: number;
  plates: number;
  rank: number;
}

interface HunterStandingRow {
  rank: number;
  total: number;
  monthly_votes: number;
  plates: number;
}

/**
 * Shared CTE. `ranked` carries the window totals so both the page query and the
 * viewer standing can reuse one definition and stay consistent.
 */
function hunterBoardCte(
  period: string,
  scope: HunterBoardScope,
  viewerId?: string,
): Prisma.Sql {
  const circleFilter =
    scope === 'circle'
      ? Prisma.sql`AND EXISTS (
          SELECT 1
          FROM "Follow" f
          WHERE f."followerId" = ${viewerId}
            AND f."followingId" = p."userId"
        )`
      : Prisma.empty;

  return Prisma.sql`
    WITH per_hunter AS (
      SELECT
        p."userId" AS id,
        u."username",
        u."image",
        SUM(p."monthlyVotes")::int AS monthly_votes,
        SUM(p."votes")::int AS total_votes,
        COUNT(*)::int AS plates
      FROM "Platinum" p
      JOIN "User" u ON u."id" = p."userId"
      WHERE p."moderationStatus" = 'PUBLISHED'
        AND p."monthlyVotesMonth" = ${period}
        AND p."monthlyVotes" > 0
        AND u."username" IS NOT NULL
        ${circleFilter}
      GROUP BY p."userId", u."username", u."image"
    ),
    ranked AS (
      SELECT
        id,
        username,
        image,
        monthly_votes,
        total_votes,
        plates,
        ROW_NUMBER() OVER (
          ORDER BY monthly_votes DESC, total_votes DESC, plates DESC, id ASC
        )::int AS rank,
        COUNT(*) OVER ()::int AS total
      FROM per_hunter
    )
  `;
}

/** One page of the monthly hunter board, scoped globally or to the viewer's follows. */
export async function getHunterLeaderboard(
  options: {
    period?: string;
    scope?: HunterBoardScope;
    viewerId?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<HunterLeaderboard> {
  const {
    period = getCurrentPeriod(),
    scope = 'global',
    viewerId,
    limit = HUNTER_BOARD_SIZE,
    offset = 0,
  } = options;

  // A circle only exists for a signed-in viewer; never leak a global board.
  if (scope === 'circle' && !viewerId) {
    return { items: [], total: 0, hasMore: false };
  }

  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 100));
  const safeOffset = Math.max(0, Math.floor(offset));
  const cte = hunterBoardCte(period, scope, viewerId);

  const [rows, counts] = await Promise.all([
    prisma.$queryRaw<HunterRow[]>(Prisma.sql`
      ${cte}
      SELECT
        r.id,
        r.username,
        r.image,
        r.monthly_votes,
        r.total_votes,
        r.plates,
        r.rank
      FROM ranked r
      ORDER BY r.rank ASC
      LIMIT ${safeLimit + 1} OFFSET ${safeOffset}
    `),
    prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
      ${cte}
      SELECT COUNT(*)::int AS total
      FROM ranked r
    `),
  ]);

  const hasMore = rows.length > safeLimit;
  const visible = hasMore ? rows.slice(0, safeLimit) : rows;

  return {
    items: visible.map((row) => ({
      userId: row.id,
      username: row.username,
      avatarUrl: row.image ?? generatedAvatarUrl(row.username),
      rank: row.rank,
      monthlyVotes: row.monthly_votes,
      totalVotes: row.total_votes,
      plates: row.plates,
    })),
    total: counts[0]?.total ?? 0,
    hasMore,
  };
}

/**
 * The signed-in hunter's position on the board. Returns null when they have no
 * votes this month, so the UI can nudge them instead of showing a fake rank.
 */
export async function getViewerHunterStanding(
  viewerId: string,
  options: { period?: string; scope?: HunterBoardScope } = {},
): Promise<HunterStanding | null> {
  const { period = getCurrentPeriod(), scope = 'global' } = options;

  const [row] = await prisma.$queryRaw<HunterStandingRow[]>(Prisma.sql`
    ${hunterBoardCte(period, scope, viewerId)}
    SELECT r.rank, r.total, r.monthly_votes, r.plates
    FROM ranked r
    WHERE r.id = ${viewerId}
  `);

  if (!row) return null;

  return {
    rank: row.rank,
    total: row.total,
    monthlyVotes: row.monthly_votes,
    plates: row.plates,
  };
}
