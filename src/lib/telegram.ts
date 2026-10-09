import type { AiVerdictLabel, ReportReason } from '@/generated/prisma/enums';
import { REPORT_REASON_LABELS } from '@/lib/report-labels';

const TELEGRAM_API = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 10_000;

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

export type ModerationNoticeSource = 'upload' | 'report';

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
  const heading =
    notice.source === 'upload'
      ? '🚨 <b>Platino marcado por la IA</b>'
      : '🚩 <b>Platino reportado y marcado por la IA</b>';

  const lines: string[] = [heading, ''];
  lines.push(`🎮 <b>${escapeHtml(notice.gameName)}</b>`);
  if (notice.ownerUsername) {
    lines.push(`👤 Autor: <b>@${escapeHtml(notice.ownerUsername)}</b>`);
  }
  lines.push(
    `${VERDICT_EMOJI[notice.label]} Veredicto: <b>${VERDICT_TITLE[notice.label]}</b>` +
      (notice.category ? ` · ${escapeHtml(notice.category)}` : ''),
  );
  if (notice.confidence != null) {
    lines.push(`📊 Confianza: <b>${Math.round(notice.confidence * 100)}%</b>`);
  }
  if (notice.summary) {
    lines.push(`📝 <i>${escapeHtml(notice.summary)}</i>`);
  }
  lines.push(
    `🔖 Estado: <b>${notice.moderationStatus === 'HIDDEN' ? 'Hidden' : 'Under review'}</b>`,
  );

  if (notice.source === 'report') {
    lines.push('');
    const reason = notice.reportReason
      ? REPORT_REASON_LABELS[notice.reportReason]
      : 'Report';
    lines.push(`🚩 Reporte: <b>${escapeHtml(reason)}</b>`);
    if (notice.reporterUsername) {
      lines.push(`🙋 Reportado por: <b>@${escapeHtml(notice.reporterUsername)}</b>`);
    }
    if (notice.reportMessage) {
      lines.push(`💬 <i>${escapeHtml(notice.reportMessage)}</i>`);
    }
  }

  lines.push(`🕐 <code>${new Date().toISOString()}</code>`);

  const keyboard: InlineKeyboardButton[][] = [];
  if (siteUrl) {
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

async function callTelegram(
  config: TelegramConfig,
  method: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
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
    if (!response.ok) {
      console.warn(`[telegram] ${method} responded ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[telegram] ${method} failed`, error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Best-effort alert to the moderator chat; never throws. */
export async function sendModerationNotice(
  notice: ModerationNotice,
): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;
  const { text, keyboard } = buildModerationNotice(notice);
  return callTelegram(config, 'sendMessage', {
    chat_id: config.chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard,
  });
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
