import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  avatarImageKey,
  deleteImage,
  isStorageConfigured,
} from '../src/lib/b2';

/**
 * Destructive dev-only reset: empties every domain table but keeps the schema
 * and `_prisma_migrations`. Use it after shipping the verification gate so the
 * old test accounts do not have to be verified by hand.
 *
 *   pnpm db:wipe --yes
 *   pnpm db:wipe --yes --with-images   # also remove B2 objects (needs B2_*)
 *
 * JWT sessions survive the delete; sign out / clear cookies afterwards.
 */
const STORED_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

function imageKeyFromUrl(imageUrl: string): string | null {
  if (!imageUrl.startsWith('/api/images/')) return null;
  const key = imageUrl.slice('/api/images/'.length);
  return STORED_KEY_PATTERN.test(key) ? key : null;
}

const TRUNCATE = `
TRUNCATE TABLE
  "EmailToken",
  "Notification",
  "Vote",
  "Report",
  "Platinum",
  "ProfileLink",
  "Follow",
  "Account",
  "Session",
  "VerificationToken",
  "UsernameHistory",
  "MonthlyResult",
  "ImageVerdict",
  "FlaggedHash",
  "User"
RESTART IDENTITY CASCADE;
`;

async function main() {
  const confirmed = process.argv.includes('--yes');
  const withImages = process.argv.includes('--with-images');

  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    throw new Error('Refusing to wipe a production database.');
  }
  if (!confirmed) {
    throw new Error('Refusing to wipe without --yes.');
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const host = (() => {
    try {
      return new URL(connectionString).host;
    } catch {
      return 'unknown host';
    }
  })();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const [users, platinums] = await Promise.all([
      prisma.user.count(),
      prisma.platinum.count(),
    ]);
    console.log(`Wiping ${host}: ${users} users, ${platinums} platinums.`);

    if (withImages) {
      if (!isStorageConfigured()) {
        throw new Error('B2 storage is not configured; drop --with-images or set B2_*.');
      }

      const [plates, accounts] = await Promise.all([
        prisma.platinum.findMany({ select: { imageUrl: true } }),
        prisma.user.findMany({ select: { id: true, image: true } }),
      ]);

      const keys = new Set<string>();
      for (const plate of plates) {
        const key = imageKeyFromUrl(plate.imageUrl);
        if (key) keys.add(key);
      }
      for (const account of accounts) {
        if (account.image) keys.add(avatarImageKey(account.id));
      }

      let removed = 0;
      for (const key of keys) {
        try {
          await deleteImage(key);
          removed += 1;
        } catch (error) {
          console.warn(`[wipe] could not delete ${key}`, error);
        }
      }
      console.log(`Deleted ${removed}/${keys.size} storage objects.`);
    }

    await prisma.$executeRawUnsafe(TRUNCATE);
    console.log('Database wiped. Sign out / clear cookies before signing in again.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
