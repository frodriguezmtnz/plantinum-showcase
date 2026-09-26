import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "@/lib/period";

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
    where: { userId },
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
  const platinums = await prisma.platinum.findMany();
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
    ...(platform && platform !== 'all' ? { platform } : {}),
    ...(search
      ? { gameName: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const orderBy =
    sort === 'most-voted'
      ? { votes: 'desc' as const }
      : sort === 'least-voted'
        ? { votes: 'asc' as const }
        : { platinumDate: 'desc' as const };

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
): Promise<Platinum | undefined> {
  const platinum = await prisma.platinum.findUnique({ where: { id } });
  if (!platinum) return undefined;
  const [view] = await attachVoteStatus([platinum], currentUserId);
  return view;
}

export async function getPlatinumsByUserId(
  userId: string,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({ where: { userId } });
  return attachVoteStatus(platinums, currentUserId);
}

export async function getHallOfFame(
  limit: number = 1,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
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
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    select: { id: true },
  });

  const platinums = await prisma.platinum.findMany({
    where: {
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
    orderBy: { platinumDate: 'desc' },
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}

export async function getMonthlyRaceStats(): Promise<{ plates: number; votes: number }> {
  const [plates, agg] = await Promise.all([
    prisma.platinum.count({
      where: { monthlyVotesMonth: getCurrentPeriod(), monthlyVotes: { gt: 0 } },
    }),
    prisma.platinum.aggregate({
      where: { monthlyVotesMonth: getCurrentPeriod() },
      _sum: { monthlyVotes: true },
    }),
  ]);
  return { plates, votes: agg._sum.monthlyVotes ?? 0 };
}

export async function getMonthlyRanking(
  limit: number = 10,
  currentUserId?: string,
): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    where: {
      monthlyVotesMonth: getCurrentPeriod(),
      monthlyVotes: { gt: 0 },
    },
    orderBy: [{ monthlyVotes: 'desc' }, { votes: 'desc' }],
    take: limit,
  });
  return attachVoteStatus(platinums, currentUserId);
}
