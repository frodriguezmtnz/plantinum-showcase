import { prisma } from "@/lib/prisma";
import { getCurrentPeriod, shiftPeriod } from "@/lib/period";
import {
  PROFILE_PAGE_SIZE,
  type ProfilePlatformFilter,
  type ProfileSort,
} from "@/lib/profile-gallery";
import type { ReportReason } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

export type ModerationStatus = 'PUBLISHED' | 'UNDER_REVIEW' | 'HIDDEN';

/** Only these plates show up in public lists; owners see their own otherwise. */
const PUBLISHED_ONLY = { moderationStatus: 'PUBLISHED' as const };

export interface Platinum {
  id: string;
  hash: string;
  gameName: string;
  platform: 'PS3' | 'PS4' | 'PS5';
  platinumDate: string;
  isSpoiler: boolean;
  userId: string;
  votes: number;
  monthlyVotes: number;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
  comment?: string | null;
  hasVoted?: boolean;
  moderationStatus: ModerationStatus;
}

export interface User {
  id: string;
  username: string;
  avatarUrl: string;
}

interface PlatinumRecord {
  id: string;
  hash: string;
  gameName: string;
  platform: string;
  platinumDate: Date;
  isSpoiler: boolean;
  userId: string;
  votes: number;
  monthlyVotes: number;
  monthlyVotesMonth: string | null;
  imageUrl: string;
  imageHint: string;
  width: number;
  height: number;
  comment?: string | null;
  moderationStatus: string;
}

interface UserRecord {
  id: string;
  username: string | null;
  image: string | null;
}

const toPlatinumView = (p: PlatinumRecord, hasVoted = false): Platinum => ({
  id: p.id,
  hash: p.hash,
  gameName: p.gameName,
  platform: p.platform as 'PS3' | 'PS4' | 'PS5',
  platinumDate: p.platinumDate.toISOString(),
  isSpoiler: p.isSpoiler,
  userId: p.userId,
  votes: p.votes,
  monthlyVotes: p.monthlyVotesMonth === getCurrentPeriod() ? p.monthlyVotes : 0,
  imageUrl: p.imageUrl,
  imageHint: p.imageHint,
  width: p.width,
  height: p.height,
  comment: p.comment,
  hasVoted,
  moderationStatus: p.moderationStatus as ModerationStatus,
});

export const toUserView = (u: UserRecord): User => ({
  id: u.id,
  username: u.username ?? 'Unknown',
  avatarUrl: u.image ?? `https://i.pravatar.cc/150?u=${u.id}`,
});

async function attachVoteStatus(
  platinums: PlatinumRecord[],
  currentUserId?: string,
): Promise<Platinum[]> {
  if (!currentUserId || platinums.length === 0) {
    return platinums.map((p) => toPlatinumView(p, false));
  }

  const votes = await prisma.vote.findMany({
    where: {
      userId: currentUserId,
      platinumId: { in: platinums.map((p) => p.id) },
    },
    select: { platinumId: true },
  });

  const votedIds = new Set(votes.map((vote) => vote.platinumId));

  return platinums.map((p) => toPlatinumView(p, votedIds.has(p.id)));
}

// Data access functions
export async function getUsers(): Promise<User[]> {
  const users = await prisma.user.findMany();
  return users.map((u) => toUserView(u));
}

/** Targeted lookup for name/avatar mapping on boards — never loads the table. */
export async function getUsersByIds(ids: string[]): Promise<User[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const users = await prisma.user.findMany({ where: { id: { in: unique } } });
  return users.map((u) => toUserView(u));
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return undefined;
  return toUserView(user);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return undefined;
  return toUserView(user);
}

export async function getPlatinums(): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({ where: { ...PUBLISHED_ONLY } });
  return platinums.map((p) => toPlatinumView(p));
}

export interface PlatinumPageItem {
  platinum: Platinum;
  user: User;
}

export interface PlatinumPageResult {
  items: PlatinumPageItem[];
  hasMore: boolean;
}

export const PLATINUMS_PAGE_SIZE = 24;

/** Shared sort for the gallery-style lists (Explore and the follow feed). */
function platinumListOrderBy(
  sort: string,
): Prisma.PlatinumOrderByWithRelationInput[] {
  if (sort === 'most-voted') {
    return [{ votes: 'desc' }, { platinumDate: 'desc' }];
  }
  if (sort === 'least-voted') {
    return [{ votes: 'asc' }, { platinumDate: 'desc' }];
  }
  return [{ platinumDate: 'desc' }];
}

export async function getPlatinumsPage(options: {
  q?: string;
  platform?: string;
  sort?: string;
  offset?: number;
  limit?: number;
  currentUserId?: string;
}): Promise<PlatinumPageResult> {
  const {
    q = '',
    platform = 'all',
    sort = 'recent',
    offset = 0,
    limit = PLATINUMS_PAGE_SIZE,
    currentUserId,
  } = options;

  const search = q.trim();

  const where = {
    ...PUBLISHED_ONLY,
    ...(platform && platform !== 'all' ? { platform } : {}),
    ...(search
      ? { gameName: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const platinums = await prisma.platinum.findMany({
    where,
    orderBy: platinumListOrderBy(sort),
    skip: offset,
    take: limit + 1,
    include: { user: true },
  });

  const hasMore = platinums.length > limit;
  const visible = platinums.slice(0, limit);
  const views = await attachVoteStatus(visible, currentUserId);

  return {
    items: views.map((platinum, index) => ({
      platinum,
      user: toUserView(visible[index]!.user),
    })),
    hasMore,
  };
}

/**
 * Gallery plates limited to the hunters `followerId` follows. Same filters and
 * sort as Explore, so the feed is just another source over the same board.
 */
export async function getFollowingFeedPage(options: {
  followerId: string;
  q?: string;
  platform?: string;
  sort?: string;
  offset?: number;
  limit?: number;
  currentUserId?: string;
}): Promise<PlatinumPageResult> {
  const {
    followerId,
    q = '',
    platform = 'all',
    sort = 'recent',
    offset = 0,
    limit = PLATINUMS_PAGE_SIZE,
    currentUserId,
  } = options;

  const search = q.trim();

  const where = {
    ...PUBLISHED_ONLY,
    // The plate's author is followed by the viewer.
    user: { followers: { some: { followerId } } },
    ...(platform && platform !== 'all' ? { platform } : {}),
    ...(search
      ? { gameName: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const platinums = await prisma.platinum.findMany({
    where,
    orderBy: platinumListOrderBy(sort),
    skip: offset,
    take: limit + 1,
    include: { user: true },
  });

  const hasMore = platinums.length > limit;
  const visible = platinums.slice(0, limit);
  const views = await attachVoteStatus(visible, currentUserId);

  return {
    items: views.map((platinum, index) => ({
      platinum,
      user: toUserView(visible[index]!.user),
    })),
    hasMore,
  };
}

export async function getPlatinumById(
  id: string,
  currentUserId?: string,
  options: { includeUnpublished?: boolean } = {},
): Promise<Platinum | undefined> {
  const platinum = await prisma.platinum.findUnique({ where: { id } });
  if (!platinum) return undefined;

  // A plate that is not PUBLISHED is only reachable by its owner (or a
  // moderator, who passes includeUnpublished) — never by a public URL.
  if (platinum.moderationStatus !== 'PUBLISHED' && !options.includeUnpublished) {
    if (platinum.userId !== currentUserId) return undefined;
  }

  const [view] = await attachVoteStatus([platinum], currentUserId);
  return view;
}

export async function getPlatinumsByUserId(
  userId: string,
  currentUserId?: string,
): Promise<Platinum[]> {
  // The owner sees their whole shelf (with a status chip); everyone else only
  // the published ones.
  const where =
    userId === currentUserId ? { userId } : { userId, ...PUBLISHED_ONLY };
  const platinums = await prisma.platinum.findMany({
    where,
    orderBy: [{ platinumDate: 'desc' }, { id: 'desc' }],
  });
  return attachVoteStatus(platinums, currentUserId);
}

export interface ProfileSummary {
  totalPlatinums: number;
  totalVotes: number;
  activeMonths: number;
  months: { key: string; count: number }[];
  platforms: { platform: string; count: number }[];
  topVoted: { id: string; gameName: string; votes: number }[];
}

export interface ProfileGalleryResult {
  items: Platinum[];
  total: number;
  hasMore: boolean;
}

const PROFILE_PLATFORM_ORDER = ['PS5', 'PS4', 'PS3'];

/** Totals, monthly pace, platform split and top-voted plates for a profile. */
export async function getProfileSummary(
  userId: string,
  currentUserId?: string,
): Promise<ProfileSummary> {
  const isOwner = userId === currentUserId;
  const where = {
    userId,
    ...(isOwner ? {} : PUBLISHED_ONLY),
  };

  const currentPeriod = getCurrentPeriod();
  const periods = Array.from({ length: 12 }, (_, index) =>
    shiftPeriod(currentPeriod, index - 11),
  );
  const [startYear, startMonth] = periods[0]!.split('-').map(Number);

  const [totals, monthlyRows, platformRows, topVoted] = await Promise.all([
    prisma.platinum.aggregate({
      where,
      _count: { _all: true },
      _sum: { votes: true },
    }),
    prisma.$queryRaw<{ month: string; count: number }[]>`
      SELECT
        to_char(
          date_trunc(
            'month',
            ("platinumDate" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid'
          ),
          'YYYY-MM'
        ) AS month,
        count(*)::int AS count
      FROM "Platinum"
      WHERE "userId" = ${userId}
        AND (${isOwner}::boolean OR "moderationStatus" = 'PUBLISHED')
        AND date_trunc(
          'month',
          ("platinumDate" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Madrid'
        ) >= make_date(${startYear!}, ${startMonth!}, 1)
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    prisma.platinum.groupBy({
      by: ['platform'],
      where,
      _count: { _all: true },
    }),
    prisma.platinum.findMany({
      where: { ...where, votes: { gt: 0 } },
      orderBy: [{ votes: 'desc' }, { platinumDate: 'desc' }, { id: 'desc' }],
      take: 5,
      select: { id: true, gameName: true, votes: true },
    }),
  ]);

  const counts = new Map(monthlyRows.map((row) => [row.month, row.count]));
  const months = periods.map((key) => ({ key, count: counts.get(key) ?? 0 }));
  const platforms = platformRows
    .map((row) => ({ platform: row.platform, count: row._count._all }))
    .sort((a, b) => {
      const aIndex = PROFILE_PLATFORM_ORDER.indexOf(a.platform);
      const bIndex = PROFILE_PLATFORM_ORDER.indexOf(b.platform);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.platform.localeCompare(b.platform);
    });

  return {
    totalPlatinums: totals._count._all,
    totalVotes: totals._sum.votes ?? 0,
    activeMonths: months.filter((month) => month.count > 0).length,
    months,
    platforms,
    topVoted,
  };
}

const PROFILE_ORDER_BY: Record<
  ProfileSort,
  Prisma.PlatinumOrderByWithRelationInput[]
> = {
  newest: [{ platinumDate: 'desc' }, { id: 'desc' }],
  oldest: [{ platinumDate: 'asc' }, { id: 'asc' }],
  'most-voted': [{ votes: 'desc' }, { platinumDate: 'desc' }, { id: 'desc' }],
  'least-voted': [{ votes: 'asc' }, { platinumDate: 'desc' }, { id: 'desc' }],
  'name-asc': [{ gameName: 'asc' }, { platinumDate: 'desc' }, { id: 'desc' }],
  'name-desc': [{ gameName: 'desc' }, { platinumDate: 'desc' }, { id: 'desc' }],
  'platform-asc': [
    { platform: 'asc' },
    { platinumDate: 'desc' },
    { id: 'desc' },
  ],
  'platform-desc': [
    { platform: 'desc' },
    { platinumDate: 'desc' },
    { id: 'desc' },
  ],
};

/** Offset window for a profile gallery, with filters and a stable sort. */
export async function getProfileGalleryItems(options: {
  userId: string;
  currentUserId?: string;
  platform?: ProfilePlatformFilter;
  sort?: ProfileSort;
  offset?: number;
  limit?: number;
}): Promise<ProfileGalleryResult> {
  const {
    userId,
    currentUserId,
    platform = 'all',
    sort = 'newest',
    offset = 0,
    limit = PROFILE_PAGE_SIZE,
  } = options;

  const where = {
    userId,
    ...(userId === currentUserId ? {} : PUBLISHED_ONLY),
    ...(platform !== 'all' ? { platform } : {}),
  };

  const [total, platinums] = await Promise.all([
    prisma.platinum.count({ where }),
    prisma.platinum.findMany({
      where,
      orderBy: PROFILE_ORDER_BY[sort],
      skip: offset,
      take: limit + 1,
    }),
  ]);

  const hasMore = platinums.length > limit;
  const visible = platinums.slice(0, limit);

  return {
    items: await attachVoteStatus(visible, currentUserId),
    total,
    hasMore,
  };
}

/** Uploads created by the user in the current Europe/Madrid calendar month. */
export async function countUploadsInCurrentPeriod(userId: string): Promise<number> {
  const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const rows = await prisma.platinum.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const period = getCurrentPeriod();
  return rows.filter((r) => getCurrentPeriod(r.createdAt) === period).length;
}

export async function getHallOfFame(
  limit: number = 1,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
      ...PUBLISHED_ONLY,
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

export async function getTopPlatinums(
  limit: number = 5,
  currentUserId?: string,
): Promise<Platinum[]> {
  const hallOfFame = await prisma.platinum.findFirst({
    where: {
      ...PUBLISHED_ONLY,
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    select: { id: true },
  });

  const platinums = await prisma.platinum.findMany({
    where: {
      ...PUBLISHED_ONLY,
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
      ...(hallOfFame ? { id: { not: hallOfFame.id } } : {}),
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

export async function getLatestPlatinums(
  limit: number = 8,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: { ...PUBLISHED_ONLY },
    orderBy: { platinumDate: 'desc' },
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

/**
 * All-time most-voted plates, spoiler-free. Fills the home race row when the
 * current month is thin or empty so a fresh board never reads as an empty
 * shelf — the votes are real, the plates just come from earlier months.
 */
export async function getMostVotedPlatinums(
  limit: number = 8,
  excludeIds: string[] = [],
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
      ...PUBLISHED_ONLY,
      isSpoiler: false,
      votes: { gt: 0 },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: [{ votes: 'desc' }, { platinumDate: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

export async function getCommunityStats(): Promise<{
  platinums: number;
  votes: number;
  hunters: number;
  games: number;
}> {
  const [platinums, agg, hunters, games] = await Promise.all([
    prisma.platinum.count({ where: { ...PUBLISHED_ONLY } }),
    prisma.platinum.aggregate({ where: { ...PUBLISHED_ONLY }, _sum: { votes: true } }),
    prisma.user.count({ where: { platinums: { some: { ...PUBLISHED_ONLY } } } }),
    prisma.platinum.groupBy({ by: ['gameName'], where: { ...PUBLISHED_ONLY } }),
  ]);

  return {
    platinums,
    votes: agg._sum.votes ?? 0,
    hunters,
    games: games.length,
  };
}

export async function getMonthlyRaceStats(): Promise<{ plates: number; votes: number }> {  const [plates, agg] = await Promise.all([
    prisma.platinum.count({
      where: {
        ...PUBLISHED_ONLY,
        monthlyVotesMonth: getCurrentPeriod(),
        monthlyVotes: { gt: 0 },
      },
    }),
    prisma.platinum.aggregate({
      where: { ...PUBLISHED_ONLY, monthlyVotesMonth: getCurrentPeriod() },
      _sum: { monthlyVotes: true },
    }),
  ]);
  return { plates, votes: agg._sum.monthlyVotes ?? 0 };
}

export interface ModerationReportItem {
  id: string;
  reason: ReportReason;
  message: string | null;
  createdAt: string;
  platinumId: string;
  hash: string;
  gameName: string;
  imageUrl: string;
  isSpoiler: boolean;
  ownerUsername: string;
  reporterUsername: string;
}

export const MODERATION_PAGE_SIZE = 20;

export interface ModerationReportPage {
  items: ModerationReportItem[];
  total: number;
  hasMore: boolean;
}

/** Open reports for the moderation board, newest first, paginated/filterable. */
export async function getOpenReports(options: {
  reason?: ReportReason | 'all';
  offset?: number;
  limit?: number;
} = {}): Promise<ModerationReportPage> {
  const { reason = 'all', offset = 0, limit = MODERATION_PAGE_SIZE } = options;
  const where = {
    status: 'OPEN' as const,
    ...(reason !== 'all' ? { reason } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      include: {
        platinum: {
          select: {
            id: true,
            hash: true,
            gameName: true,
            imageUrl: true,
            isSpoiler: true,
            user: { select: { username: true } },
          },
        },
        user: { select: { username: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  const hasMore = reports.length > limit;
  const items = reports.slice(0, limit).map((report) => ({
    id: report.id,
    reason: report.reason,
    message: report.message,
    createdAt: report.createdAt.toISOString(),
    platinumId: report.platinum.id,
    hash: report.platinum.hash,
    gameName: report.platinum.gameName,
    imageUrl: report.platinum.imageUrl,
    isSpoiler: report.platinum.isSpoiler,
    ownerUsername: report.platinum.user.username ?? 'Unknown',
    reporterUsername: report.user.username ?? 'Unknown',
  }));

  return { items, total, hasMore };
}

/** Whether the viewer already has an open report on this plate. */
export async function getOpenReportForUser(
  platinumId: string,
  userId?: string,
): Promise<boolean> {
  if (!userId) return false;
  const report = await prisma.report.findUnique({
    where: { userId_platinumId: { userId, platinumId } },
    select: { status: true },
  });
  return report?.status === 'OPEN';
}

export interface ModerationPlateItem {
  id: string;
  hash: string;
  gameName: string;
  imageUrl: string;
  isSpoiler: boolean;
  ownerUsername: string;
  reportCount: number;
}

export interface ModerationPlatePage {
  items: ModerationPlateItem[];
  total: number;
  hasMore: boolean;
}

export type HiddenPlatinumItem = ModerationPlateItem;
export type HiddenPlatinumPage = ModerationPlatePage;
export type UnderReviewPlatinumItem = ModerationPlateItem;

/** Narrow a moderation list by the cached AI label of the screenshot. */
export type ModerationVerdictFilter = 'all' | 'unsafe' | 'review' | 'safe';

const VERDICT_FILTER_LABEL = {
  unsafe: 'UNSAFE',
  review: 'REVIEW',
  safe: 'SAFE',
} as const;

async function getPlatinumsByModerationStatus(
  status: ModerationStatus,
  options: {
    offset?: number;
    limit?: number;
    verdict?: ModerationVerdictFilter;
  } = {},
): Promise<ModerationPlatePage> {
  const { offset = 0, limit = MODERATION_PAGE_SIZE, verdict = 'all' } = options;

  let hashes: string[] | null = null;
  if (verdict !== 'all') {
    const rows = await prisma.imageVerdict.findMany({
      where: { label: VERDICT_FILTER_LABEL[verdict] },
      select: { hash: true },
    });
    hashes = rows.map((row) => row.hash);
    if (hashes.length === 0) {
      return { items: [], total: 0, hasMore: false };
    }
  }

  const where = {
    moderationStatus: status,
    ...(hashes ? { hash: { in: hashes } } : {}),
  };

  const [plates, total] = await Promise.all([
    prisma.platinum.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit + 1,
      include: {
        user: { select: { username: true } },
        _count: { select: { reports: true } },
      },
    }),
    prisma.platinum.count({ where }),
  ]);

  const hasMore = plates.length > limit;
  const items = plates.slice(0, limit).map((plate) => ({
    id: plate.id,
    hash: plate.hash,
    gameName: plate.gameName,
    imageUrl: plate.imageUrl,
    isSpoiler: plate.isSpoiler,
    ownerUsername: plate.user.username ?? 'Unknown',
    reportCount: plate._count.reports,
  }));

  return { items, total, hasMore };
}

/** Plates currently taken down, newest first, paginated. */
export function getHiddenPlatinums(
  options: {
    offset?: number;
    limit?: number;
    verdict?: ModerationVerdictFilter;
  } = {},
): Promise<ModerationPlatePage> {
  return getPlatinumsByModerationStatus('HIDDEN', options);
}

/** Plates flagged by AI screening that still need a moderator decision. */
export function getUnderReviewPlatinums(
  options: {
    offset?: number;
    limit?: number;
    verdict?: ModerationVerdictFilter;
  } = {},
): Promise<ModerationPlatePage> {
  return getPlatinumsByModerationStatus('UNDER_REVIEW', options);
}

export async function getMonthlyRanking(
  limit: number = 10,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
      ...PUBLISHED_ONLY,
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

/**
 * The same monthly race, but scoped to the hunters `viewerId` follows. Powers
 * the "My circle" tab in the Hall of Fame.
 */
export async function getFollowingMonthlyRanking(
  viewerId: string,
  limit: number = 10,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
      ...PUBLISHED_ONLY,
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
      user: { followers: { some: { followerId: viewerId } } },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}
