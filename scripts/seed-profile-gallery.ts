import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

const USERNAME = process.env.DEMO_PROFILE_USERNAME ?? 'trophy-hunter-1';
const DEMO_HASH_PREFIX = 'demo-gallery-';
const DEMO_COUNT = 120;
const PLATFORMS = ['PS5', 'PS4', 'PS3'] as const;

async function cleanDemoRows(userId: string) {
  const result = await prisma.platinum.deleteMany({
    where: { userId, hash: { startsWith: DEMO_HASH_PREFIX } },
  });
  return result.count;
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { username: USERNAME },
    select: { id: true, username: true },
  });

  if (!user) {
    throw new Error(
      `User "${USERNAME}" not found. Set DEMO_PROFILE_USERNAME to an existing profile.`,
    );
  }

  const removed = await cleanDemoRows(user.id);
  if (process.argv.includes('--clean')) {
    console.log(`Removed ${removed} demo platinums from ${user.username}.`);
    return;
  }

  const now = new Date();
  const base = {
    userId: user.id,
    imageUrl: '/apple-icon.png',
    imageHint: 'demo gallery fixture',
    width: 1024,
    height: 1024,
    watermarked: false,
    moderationStatus: 'PUBLISHED' as const,
  };

  await prisma.platinum.createMany({
    data: Array.from({ length: DEMO_COUNT }, (_, index) => ({
      ...base,
      hash: `${DEMO_HASH_PREFIX}${String(index + 1).padStart(3, '0')}`,
      gameName: `Demo Platinum ${String(index + 1).padStart(3, '0')}`,
      platform: PLATFORMS[index % PLATFORMS.length]!,
      platinumDate: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (index % 12), 10 + (index % 15)),
      ),
      votes: (index * 17) % 251,
      isSpoiler: index % 23 === 0,
    })),
  });

  console.log(
    `Seeded ${DEMO_COUNT} demo platinums into ${user.username} (previous demo rows removed: ${removed}).`,
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
