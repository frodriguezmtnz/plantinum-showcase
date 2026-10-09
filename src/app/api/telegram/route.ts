import { NextRequest, NextResponse } from 'next/server';
import { answerCallbackQuery, getTelegramConfig, parseCallbackData } from '@/lib/telegram';
import { applyPlatinumModeration, applyReportDecision } from '@/lib/moderation-core';

export const runtime = 'nodejs';

interface TelegramUpdate {
  callback_query?: {
    id: string;
    data?: string;
    message?: { chat?: { id?: number | string } };
  };
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    return request.headers.get('x-telegram-bot-api-secret-token') === secret;
  }
  // No secret configured: only tolerated outside production.
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: NextRequest) {
  const config = getTelegramConfig();
  if (!config) {
    return NextResponse.json(
      { ok: false, error: 'Telegram is not configured' },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const callback = update?.callback_query;
  if (!callback) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(callback.message?.chat?.id ?? '');
  if (chatId !== config.chatId) {
    await answerCallbackQuery(config, callback.id, 'Not allowed');
    return NextResponse.json({ ok: true });
  }

  const parsed = parseCallbackData(callback.data);
  if (!parsed) {
    await answerCallbackQuery(config, callback.id, 'Unsupported action');
    return NextResponse.json({ ok: true });
  }

  const result =
    parsed.kind === 'platinum'
      ? await applyPlatinumModeration(parsed.id, parsed.op)
      : await applyReportDecision(parsed.id, parsed.decision);

  await answerCallbackQuery(
    config,
    callback.id,
    result.success ? 'Done ✅' : result.error,
  );

  return NextResponse.json({ ok: true });
}
