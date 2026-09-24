import { prisma } from "@/lib/prisma";

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

const toPlatinumView = (p: PlatinumRecord): Platinum => ({
  ...p,
  platform: p.platform as 'PS3' | 'PS4' | 'PS5',
  platinumDate: p.platinumDate.toISOString(),
});

const toUserView = (u: UserRecord, pridePlatinumId?: string): User => ({
  id: u.id,
  username: u.username ?? 'Unknown',
  avatarUrl: u.image ?? `https://i.pravatar.cc/150?u=${u.id}`,
  ...(pridePlatinumId ? { pridePlatinumId } : {}),
});

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
  return platinums.map(toPlatinumView);
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
}): Promise<PlatinumPageResult> {
  const {
    q = '',
    platform = 'all',
    sort = 'recent',
    offset = 0,
    limit = PLATINUMS_PAGE_SIZE,
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

  return {
    items: platinums.slice(0, limit).map((p) => ({
      platinum: toPlatinumView(p),
      user: toUserView(p.user),
    })),
    hasMore,
  };
}

export async function getPlatinumById(id: string): Promise<Platinum | undefined> {
  const platinum = await prisma.platinum.findUnique({ where: { id } });
  return platinum ? toPlatinumView(platinum) : undefined;
}

export async function getPlatinumsByUserId(userId: string): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({ where: { userId } });
  return platinums.map(toPlatinumView);
}

export async function getHallOfFame(limit: number = 1): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    orderBy: { monthlyVotes: 'desc' },
    take: limit,
  });
  return platinums.map(toPlatinumView);
}

export async function getTopPlatinums(limit: number = 5): Promise<Platinum[]> {
  const hallOfFame = await prisma.platinum.findFirst({
    orderBy: { monthlyVotes: 'desc' },
    select: { id: true },
  });
  const platinums = await prisma.platinum.findMany({
    where: hallOfFame ? { id: { not: hallOfFame.id } } : undefined,
    orderBy: { monthlyVotes: 'desc' },
    take: limit,
  });
  return platinums.map(toPlatinumView);
}

export async function getLatestPlatinums(limit: number = 8): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    orderBy: { platinumDate: 'desc' },
    take: limit,
  });
  return platinums.map(toPlatinumView);
}

export async function getMonthlyRanking(limit: number = 10): Promise<Platinum[]> {
  const platinums = await prisma.platinum.findMany({
    orderBy: { monthlyVotes: 'desc' },
    take: limit,
  });
  return platinums.map(toPlatinumView);
}