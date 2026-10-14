import { NextRequest, NextResponse } from 'next/server';
import { getTelegramConfig } from '@/lib/telegram';
import { processTelegramUpdate, type TelegramUpdate } from '@/lib/telegram-actions';

export const runtime = 'nodejs';

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
  if (update) {
    await processTelegramUpdate(config, update);
  }

  return NextResponse.json({ ok: true });
}
