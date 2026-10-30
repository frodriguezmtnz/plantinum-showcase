import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type UsernameHistoryWriter = Pick<Prisma.TransactionClient, "usernameHistory">;

/**
 * A handle is taken when a live account has it or when it lives in the
 * reservation table (renamed or deleted accounts).
 */
export async function usernameIsTaken(
  username: string,
  exceptUserId?: string,
): Promise<boolean> {
  const lower = username.toLowerCase();

  const [live, reserved] = await Promise.all([
    prisma.user.count({
      where: {
        username: { equals: username, mode: "insensitive" },
        ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
      },
    }),
    prisma.usernameHistory.count({ where: { usernameLower: lower } }),
  ]);

  return live > 0 || reserved > 0;
}

/** Reserves a released handle forever. Idempotent. */
export async function reserveUsername(
  username: string,
  userId?: string | null,
  db: UsernameHistoryWriter = prisma,
): Promise<void> {
  const usernameLower = username.toLowerCase();
  await db.usernameHistory.upsert({
    where: { usernameLower },
    create: { username, usernameLower, userId: userId ?? null },
    update: {},
  });
}
