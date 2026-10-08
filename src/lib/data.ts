import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/period";
import type { ReportReason } from "@/generated/prisma/enums";

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
  pridePlatinumId?: string;
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

const toUserView = (u: UserRecord, pridePlatinumId?: string): User => ({
  id: u.id,
  username: u.username ?? 'Unknown',
  avatarUrl: u.image ?? `https://i.pravatar.cc/150?u=${u.id}`,
  ...(pridePlatinumId ? { pridePlatinumId } : {}),
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

async function getPridePlatinumId(userId: string): Promise<string | undefined> {
  const pride = await prisma.platinum.findFirst({
    where: { userId, ...PUBLISHED_ONLY },
    orderBy: [{ votes: 'desc' }, { monthlyVotes: 'desc' }],
    select: { id: true },
  });
  return pride?.id;
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
  const pridePlatinumId = await getPridePlatinumId(user.id);
  return toUserView(user, pridePlatinumId);
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return undefined;
  const pridePlatinumId = await getPridePlatinumId(user.id);
  return toUserView(user, pridePlatinumId);
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

  const orderBy =
    sort === 'most-voted'
      ? [{ votes: 'desc' as const }, { platinumDate: 'desc' as const }]
      : sort === 'least-voted'
        ? [{ votes: 'asc' as const }, { platinumDate: 'desc' as const }]
        : [{ platinumDate: 'desc' as const }];

  const platinums = await prisma.platinum.findMany({
    where,
    orderBy,
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
  const platinums = await prisma.platinum.findMany({ where });
  return attachVoteStatus(platinums, currentUserId);
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

export interface HiddenPlatinumItem {
  id: string;
  hash: string;
  gameName: string;
  imageUrl: string;
  isSpoiler: boolean;
  ownerUsername: string;
  reportCount: number;
}

export interface HiddenPlatinumPage {
  items: HiddenPlatinumItem[];
  total: number;
  hasMore: boolean;
}

/** Plates currently taken down, newest first, paginated. */
export async function getHiddenPlatinums(options: {
  offset?: number;
  limit?: number;
} = {}): Promise<HiddenPlatinumPage> {
  const { offset = 0, limit = MODERATION_PAGE_SIZE } = options;
  const where = { moderationStatus: 'HIDDEN' as const };

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
