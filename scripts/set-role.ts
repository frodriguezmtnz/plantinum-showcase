import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { Role } from "../src/generated/prisma/enums";

/**
 * Promote (or demote) a user's moderator role.
 *
 *   pnpm set-role <username> [USER|MODERATOR|ADMIN]
 *
 * Defaults to ADMIN when no role is given. Changes take effect on the user's
 * next request — authorization re-reads the role from the database.
 */
async function main() {
  const [username, rawRole] = process.argv.slice(2);

  if (!username) {
    console.error("Usage: pnpm set-role <username> [USER|MODERATOR|ADMIN]");
    process.exit(1);
  }

  const role = (rawRole ?? "ADMIN").toUpperCase() as Role;
  if (!Object.values(Role).includes(role)) {
    console.error(`Unknown role "${rawRole}". Use USER, MODERATOR or ADMIN.`);
    process.exit(1);
  }

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
    console.error(error);
    process.exit(1);
  });
