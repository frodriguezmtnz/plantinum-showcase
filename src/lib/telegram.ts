import type { AiVerdictLabel, ReportReason } from '@/generated/prisma/enums';
import { REPORT_REASON_LABELS } from '@/lib/report-labels';

const TELEGRAM_API = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 10_000;
/** Telegram rejects messages longer than 4096 characters (HTML included). */
const MAX_MESSAGE_LENGTH = 4096;
/** Cap the wait for a 429 retry so server actions never block for long. */
const MAX_RETRY_AFTER_S = 5;

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  siteUrl: string;
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getTelegramConfig(): TelegramConfig | null {
  const botToken = readEnv('TELEGRAM_BOT_TOKEN');
  const chatId = readEnv('TELEGRAM_CHAT_ID');
  if (!botToken || !chatId) return null;
  const siteUrl = (
    readEnv('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:9002'
  ).replace(/\/+$/, '');
  return { botToken, chatId, siteUrl };
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() !== null;
}

export type ModerationNoticeSource = 'upload' | 'report' | 'appeal';

export interface ModerationNotice {
  source: ModerationNoticeSource;
  platinumId: string;
  gameName: string;
  ownerUsername?: string | null;
  label: AiVerdictLabel;
  category: string | null;
  confidence: number | null;
  summary: string | null;
  moderationStatus: 'UNDER_REVIEW' | 'HIDDEN';
  /** True when no AI verdict exists (screening off) and a human must decide. */
  manual?: boolean;
  reportId?: string;
  reportReason?: ReportReason | null;
  reportMessage?: string | null;
  reporterUsername?: string | null;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Telegram rejects inline button URLs that aren't publicly reachable (e.g.
 * `http://localhost`), which would fail the whole sendMessage. In local dev we
 * therefore skip the link row and keep only the moderation action buttons.
 */
function isPublicUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    return !['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(
      hostname,
    );
  } catch {
    return false;
  }
}

const VERDICT_TITLE: Record<AiVerdictLabel, string> = {
  SAFE: 'SAFE',
  REVIEW: 'REVIEW',
  UNSAFE: 'UNSAFE',
};

const VERDICT_EMOJI: Record<AiVerdictLabel, string> = {
  SAFE: '✅',
  REVIEW: '🔍',
  UNSAFE: '🚨',
};

export function buildModerationNotice(notice: ModerationNotice): {
  text: string;
  keyboard: InlineKeyboardMarkup;
} {
  const siteUrl = getTelegramConfig()?.siteUrl ?? '';
  const heading = notice.manual
    ? '📝 <b>Revisión manual requerida</b>'
    : notice.source === 'appeal'
      ? '🙋 <b>Apelación del autor</b>'
      : notice.source === 'upload'
        ? '🚨 <b>Platino marcado por la IA</b>'
        : '🚩 <b>Platino reportado y marcado por la IA</b>';

  const lines: string[] = [heading, ''];
  lines.push(`🎮 <b>${escapeHtml(notice.gameName)}</b>`);
  if (notice.ownerUsername) {
    lines.push(`👤 Autor: <b>@${escapeHtml(notice.ownerUsername)}</b>`);
  }
  if (notice.manual) {
    lines.push('🔍 Veredicto: <b>pendiente</b> (IA no configurada)');
  } else {
    lines.push(
      `${VERDICT_EMOJI[notice.label]} Veredicto: <b>${VERDICT_TITLE[notice.label]}</b>` +
        (notice.category ? ` · ${escapeHtml(notice.category)}` : ''),
    );
    if (notice.confidence != null) {
      lines.push(`📊 Confianza: <b>${Math.round(notice.confidence * 100)}%</b>`);
    }
  }
  if (notice.summary) {
    lines.push(`📝 <i>${escapeHtml(notice.summary)}</i>`);
  }
  lines.push(
    `🔖 Estado: <b>${notice.moderationStatus === 'HIDDEN' ? 'Hidden' : 'Under review'}</b>`,
  );

  if (notice.source === 'report' || notice.source === 'appeal') {
    lines.push('');
    const reason = notice.reportReason
      ? REPORT_REASON_LABELS[notice.reportReason]
      : 'Report';
    lines.push(`🚩 ${notice.source === 'appeal' ? 'Motivo' : 'Reporte'}: <b>${escapeHtml(reason)}</b>`);
    if (notice.reporterUsername) {
      lines.push(`🙋 ${notice.source === 'appeal' ? 'Apela' : 'Reportado por'}: <b>@${escapeHtml(notice.reporterUsername)}</b>`);
    }
    if (notice.reportMessage) {
      lines.push(`💬 <i>${escapeHtml(notice.reportMessage)}</i>`);
    }
  }

  lines.push(`🕐 <code>${new Date().toISOString()}</code>`);

  const keyboard: InlineKeyboardButton[][] = [];
  if (siteUrl && isPublicUrl(siteUrl)) {
    const links: InlineKeyboardButton[] = [
      { text: '🔍 Ver placa', url: `${siteUrl}/platinum/${notice.platinumId}` },
      { text: '📋 Panel', url: `${siteUrl}/admin/reports` },
    ];
    keyboard.push(links);
  }

  if (notice.source === 'report' && notice.reportId) {
    keyboard.push([
      { text: '✅ Mantener', callback_data: `RPT:${notice.reportId}:dismiss` },
      { text: '🚫 Ocultar', callback_data: `RPT:${notice.reportId}:hide` },
      { text: '🗑️ Eliminar', callback_data: `RPT:${notice.reportId}:delete` },
    ]);
  } else {
    keyboard.push([
      { text: '✅ Publicar', callback_data: `MOD:${notice.platinumId}:publish` },
      { text: '🚫 Ocultar', callback_data: `MOD:${notice.platinumId}:hide` },
      { text: '🗑️ Eliminar', callback_data: `MOD:${notice.platinumId}:delete` },
    ]);
  }

  return { text: lines.join('\n'), keyboard: { inline_keyboard: keyboard } };
}

export type ParsedCallback =
  | { kind: 'platinum'; id: string; op: 'PUBLISHED' | 'HIDDEN' | 'DELETE' }
  | { kind: 'report'; id: string; decision: 'dismiss' | 'hide' | 'delete' };

const PLATINUM_OPS = {
  publish: 'PUBLISHED',
  hide: 'HIDDEN',
  delete: 'DELETE',
} as const;

const REPORT_DECISIONS = {
  dismiss: 'dismiss',
  hide: 'hide',
  delete: 'delete',
} as const;

export function parseCallbackData(data: string | undefined): ParsedCallback | null {
  if (!data) return null;
  const [prefix, id, action] = data.split(':');
  if (!prefix || !id || !action) return null;

  if (prefix === 'MOD') {
    const op = PLATINUM_OPS[action as keyof typeof PLATINUM_OPS];
    return op ? { kind: 'platinum', id, op } : null;
  }
  if (prefix === 'RPT') {
    const decision = REPORT_DECISIONS[action as keyof typeof REPORT_DECISIONS];
    return decision ? { kind: 'report', id, decision } : null;
  }
  return null;
}

interface TelegramApiBody {
  ok?: boolean;
  description?: string;
  error_code?: number;
  parameters?: { retry_after?: number };
}

interface TelegramCallResult {
  ok: boolean;
  status: number;
  description?: string;
  retryAfterS?: number;
}

/**
 * Trims the notice to Telegram's 4096-char limit without cutting through an
 * HTML entity (`&amp;`) or an opening tag, which would fail the whole send.
 */
export function truncateMessage(
  text: string,
  limit = MAX_MESSAGE_LENGTH,
): string {
  if (text.length <= limit) return text;

  const suffix = '…';
  let cut = text.slice(0, limit - suffix.length);

  const amp = cut.lastIndexOf('&');
  if (amp !== -1 && !cut.slice(amp).includes(';')) cut = cut.slice(0, amp);

  if (cut.lastIndexOf('<') > cut.lastIndexOf('>')) {
    cut = cut.slice(0, cut.lastIndexOf('<'));
  }

  const lastNewline = cut.lastIndexOf('\n');
  if (lastNewline > 0) cut = cut.slice(0, lastNewline);

  return `${cut}${suffix}`;
}

async function callTelegramOnce(
  config: TelegramConfig,
  method: string,
  payload: Record<string, unknown>,
): Promise<TelegramCallResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${TELEGRAM_API}/bot${config.botToken}/${method}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );
    const body = (await response.json().catch(() => null)) as
      | TelegramApiBody
      | null;
    return {
      ok: response.ok && body?.ok !== false,
      status: response.status,
      description: body?.description,
      retryAfterS: body?.parameters?.retry_after,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      description: error instanceof Error ? error.message : 'network error',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Best-effort Bot API call; never throws. On 429 it retries once, honouring
 * `retry_after` (capped) so bursts of flagged uploads are not lost.
 */
async function callTelegram(
  config: TelegramConfig,
  method: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  let result = await callTelegramOnce(config, method, payload);

  if (!result.ok && result.status === 429) {
    const waitS = Math.min(result.retryAfterS ?? 1, MAX_RETRY_AFTER_S);
    console.warn(
      `[telegram] ${method} hit the rate limit; retrying in ${waitS}s`,
    );
    await sleep(waitS * 1000);
    result = await callTelegramOnce(config, method, payload);
  }

  if (!result.ok) {
    const detail = result.description ? `: ${result.description}` : '';
    console.warn(
      `[telegram] ${method} failed (${result.status || 'network'})${detail}`,
    );
    return false;
  }
  return true;
}

/** Best-effort alert to the moderator chat; never throws. */
export async function sendModerationNotice(
  notice: ModerationNotice,
): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;
  const { text, keyboard } = buildModerationNotice(notice);
  const sent = await callTelegram(config, 'sendMessage', {
    chat_id: config.chatId,
    text: truncateMessage(text),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard,
  });
  if (!sent) {
    console.warn(
      `[telegram] notice not delivered (source=${notice.source}, platinum=${notice.platinumId})`,
    );
  }
  return sent;
}

export async function answerCallbackQuery(
  config: TelegramConfig,
  callbackQueryId: string,
  text: string,
): Promise<boolean> {
  return callTelegram(config, 'answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}
