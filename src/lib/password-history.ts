import bcrypt from 'bcrypt';
import type { Prisma } from '@/generated/prisma/client';

type Db = Prisma.TransactionClient;

/** How many *previous* passwords a user cannot reuse (plus the current one). */
export const PASSWORD_HISTORY_LIMIT = 2;

export const PASSWORD_REUSE_ERROR =
  'That password was used recently. Pick a new one.';

/**
 * True when `password` matches the current hash or one of the last
 * `PASSWORD_HISTORY_LIMIT` previous ones. Callers must verify the user's
 * identity first so this cannot be used to probe the history.
 */
export async function isRecentPassword({
  db,
  userId,
  currentHash,
  password,
}: {
  db: Db;
  userId: string;
  currentHash: string | null;
  password: string;
}): Promise<boolean> {
  if (currentHash && (await bcrypt.compare(password, currentHash))) {
    return true;
  }

  const previous = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PASSWORD_HISTORY_LIMIT,
    select: { passwordHash: true },
  });

  for (const row of previous) {
    if (await bcrypt.compare(password, row.passwordHash)) return true;
  }

  return false;
}

/** Stores the hash that is about to be replaced and prunes the oldest rows. */
export async function rememberPassword({
  db,
  userId,
  passwordHash,
}: {
  db: Db;
  userId: string;
  passwordHash: string;
}): Promise<void> {
  await db.passwordHistory.create({ data: { userId, passwordHash } });

  const newest = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: PASSWORD_HISTORY_LIMIT,
    select: { id: true },
  });

  await db.passwordHistory.deleteMany({
    where: {
      userId,
      id: { notIn: newest.map((row) => row.id) },
    },
  });
}
