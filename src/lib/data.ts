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