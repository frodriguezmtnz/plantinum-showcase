import { answerCallbackQuery, parseCallbackData, type TelegramConfig } from '@/lib/telegram';
import {
  applyPlatinumModeration,
  applyReportDecision,
} from '@/lib/moderation-core';

export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: { chat?: { id?: number | string } };
}

export interface TelegramUpdate {
  update_id?: number;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramUpdateOutcome {
  /** True when the update was a callback we own (even if we rejected it). */
  handled: boolean;
  /** True when a moderation action was actually applied. */
  success: boolean;
  /** Short text shown as the Telegram toast. */
  reply: string;
}

const NOT_HANDLED: TelegramUpdateOutcome = {
  handled: false,
  success: false,
  reply: '',
};

/**
 * Shared handler for a Telegram update. Both the production webhook and the
 * local long-polling loop call this, so the moderation wiring lives in exactly
 * one place. Authorization of the transport (webhook secret / polling session)
 * is the caller's job; here we only trust the configured moderator chat id.
 */
export async function processTelegramUpdate(
  config: TelegramConfig,
  update: TelegramUpdate,
): Promise<TelegramUpdateOutcome> {
  const callback = update.callback_query;
  if (!callback) return NOT_HANDLED;

  const chatId = String(callback.message?.chat?.id ?? '');
  if (chatId !== config.chatId) {
    await answerCallbackQuery(config, callback.id, 'Not allowed');
    return { handled: true, success: false, reply: 'Not allowed' };
  }

  const parsed = parseCallbackData(callback.data);
  if (!parsed) {
    await answerCallbackQuery(config, callback.id, 'Unsupported action');
    return { handled: true, success: false, reply: 'Unsupported action' };
  }

  const result =
    parsed.kind === 'platinum'
      ? await applyPlatinumModeration(parsed.id, parsed.op)
      : await applyReportDecision(parsed.id, parsed.decision);

  const reply = result.success ? 'Done ✅' : result.error;
  await answerCallbackQuery(config, callback.id, reply);

  return { handled: true, success: result.success, reply };
}
