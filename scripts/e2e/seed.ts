import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../../src/lib/prisma";

/**
 * Idempotent fixture for the E2E suite.
 *
 * Creates (or refreshes) the test account and 14 published plates: 13 gallery
 * plates plus one spoiler. Uses a local asset so CI needs no external image host.
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... pnpm tsx scripts/e2e/seed.ts
 */

const email = process.env.E2E_EMAIL ?? "e2e@platinum-showcase.test";
const password = process.env.E2E_PASSWORD ?? "PwTest12345!";
const username = process.env.E2E_USERNAME ?? "e2e-runner";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: username, username, passwordHash },
    create: { email, name: username, username, passwordHash },
    select: { id: true },
  });

  // Keep the fixture deterministic when the script runs more than once.
  await prisma.platinum.deleteMany({ where: { userId: user.id } });

  const base = {
    userId: user.id,
    platform: "PS5",
    platinumDate: new Date(),
    imageUrl: "/apple-icon.png",
    imageHint: "e2e fixture",
    width: 1024,
    height: 1024,
    watermarked: false,
    moderationStatus: "PUBLISHED" as const,
  };

  await prisma.platinum.createMany({
    data: [
      // Enough platinums to exercise the profile infinite gallery (8 per page).
      ...Array.from({ length: 13 }, (_, index) => ({
        ...base,
        hash: `e2e-gallery-${index + 1}`,
        gameName: `E2E Plate ${String(index + 1).padStart(2, "0")}`,
        isSpoiler: false,
        votes: 13 - index,
      })),
      { ...base, hash: "e2e-spoiler-plate", gameName: "E2E Spoiler Plate", platform: "PS4", isSpoiler: true },
    ],
  });

  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.notification.create({
    data: {
      userId: user.id,
      kind: "NEW_FOLLOWER",
      title: "E2E Follower started following you",
      body: "Open their profile to see their platinum shelf.",
      linkUrl: "/u/e2e-runner",
    },
  });

  console.log(`Seeded ${email} with 14 platinums and one unread notification.`);
}

main().finally(() => prisma.$disconnect());
