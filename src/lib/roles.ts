import { prisma } from "@/lib/prisma";
import type { Role } from "@/generated/prisma/enums";

const MODERATOR_ROLES: Role[] = ["MODERATOR", "ADMIN"];

/**
 * Authorization always reads the role fresh from the database (never the JWT)
 * so promoting someone takes effect on their very next request — the session
 * copy is only used to decide whether to show the Moderation link.
 */
export async function getUserRole(userId: string): Promise<Role> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? "USER";
}

export async function isModerator(userId: string): Promise<boolean> {
  return MODERATOR_ROLES.includes(await getUserRole(userId));
}

export interface ModeratorAccess {
  isModerator: boolean;
  twoFactorEnabled: boolean;
}

/** One read for the admin guard: role plus whether the account has 2FA. */
export async function getModeratorAccess(
  userId: string,
): Promise<ModeratorAccess> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, twoFactorEnabled: true },
  });
  return {
    isModerator: user ? MODERATOR_ROLES.includes(user.role) : false,
    twoFactorEnabled: Boolean(user?.twoFactorEnabled),
  };
}

export { MODERATOR_ROLES };
