import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { Role } from "../src/generated/prisma/enums";

/**
 * Promote (or demote) a user's moderator role.
 *
 *   pnpm set-role <username> [USER|MODERATOR|ADMIN] [--force]
 *
 * Defaults to ADMIN when no role is given. Changes take effect on the user's
 * next request — authorization re-reads the role from the database.
 *
 * Safety rails (mirrors wipe-dev-data.ts): refuses to run in a production
 * environment, prints the resolved database host, and requires --force when
 * that host is not localhost — a copy of the production DATABASE_URL in a
 * local .env would otherwise escalate a real account silently.
 */

function databaseHost(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? "").host;
  } catch {
    return "unknown host";
  }
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== "--force");
  const [username, rawRole] = args;

  if (!username) {
    console.error("Usage: pnpm set-role <username> [USER|MODERATOR|ADMIN] [--force]");
    process.exit(1);
  }

  const role = (rawRole ?? "ADMIN").toUpperCase() as Role;
  if (!Object.values(Role).includes(role)) {
    console.error(`Unknown role "${rawRole}". Use USER, MODERATOR or ADMIN.`);
    process.exit(1);
  }

  if (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  ) {
    throw new Error("Refusing to change roles in a production environment.");
  }

  const host = databaseHost();
  const isLocalHost =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  if (!isLocalHost && !process.argv.includes("--force")) {
    throw new Error(
      `Refusing to change roles on non-local database "${host}". ` +
        "Re-check DATABASE_URL and pass --force to proceed.",
    );
  }

  console.log(`Target database: ${host}`);

  const user = await prisma.user.update({
    where: { username },
    data: { role },
    select: { username: true, role: true },
  });

  console.log(`@${user.username} is now ${user.role}.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
