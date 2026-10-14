import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { isTelegramConfigured, sendModerationNotice } from "../src/lib/telegram";

/**
 * Sends a sample moderation notice so the inline keyboard can be exercised end
 * to end without waiting for the AI to flag a real upload.
 *
 *   pnpm telegram:test [platinumId]
 *
 * With no id it picks the most recent plate currently under review.
 */
async function main() {
  if (!isTelegramConfigured()) {
    console.error("Telegram is not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID).");
    process.exit(1);
  }

  const [platinumId] = process.argv.slice(2);

  const select = {
    id: true,
    gameName: true,
    moderationStatus: true,
    user: { select: { username: true } },
  } as const;

  const platinum = platinumId
    ? await prisma.platinum.findUnique({ where: { id: platinumId }, select })
    : await prisma.platinum.findFirst({
        where: { moderationStatus: "UNDER_REVIEW" },
        orderBy: { createdAt: "desc" },
        select,
      });

  if (!platinum) {
    console.error(
      platinumId
        ? `No platinum with id ${platinumId}.`
        : "No plate is under review. Upload one or pass a platinum id.",
    );
    process.exit(1);
  }

  const sent = await sendModerationNotice({
    source: "upload",
    platinumId: platinum.id,
    gameName: platinum.gameName,
    ownerUsername: platinum.user.username,
    label: "REVIEW",
    category: null,
    confidence: null,
    summary: "Sample notice from `pnpm telegram:test`.",
    moderationStatus:
      platinum.moderationStatus === "HIDDEN" ? "HIDDEN" : "UNDER_REVIEW",
  });

  if (!sent) {
    console.error("Telegram rejected the notice; check the token and chat id.");
    process.exit(1);
  }

  console.log(`Sample notice sent for @${platinum.user.username} (${platinum.id}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
