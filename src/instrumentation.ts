/**
 * Next.js instrumentation hook. Runs once when the server boots (node runtime).
 *
 * It starts the Telegram long-polling loop so the inline moderation buttons
 * work in local dev without a public webhook URL. Gated behind
 * TELEGRAM_POLLING=true; production uses the webhook at /api/telegram instead.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startTelegramPolling } = await import('@/lib/telegram-polling');
  startTelegramPolling();
}
