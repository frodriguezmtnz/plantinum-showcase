import { getTelegramConfig, type TelegramConfig } from '@/lib/telegram';
import { processTelegramUpdate, type TelegramUpdate } from '@/lib/telegram-actions';

const TELEGRAM_API = 'https://api.telegram.org';
const POLL_TIMEOUT_S = 25;
const CLIENT_TIMEOUT_MS = (POLL_TIMEOUT_S + 15) * 1000;
const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

interface TelegramApiBody {
  ok?: boolean;
  result?: unknown;
  error_code?: number;
  description?: string;
}

interface TelegramApiResult {
  ok: boolean;
  status: number;
  result: unknown;
  errorCode?: number;
  description?: string;
}

interface PollerState {
  started: boolean;
}

const globalForTelegram = globalThis as unknown as {
  __telegramPoller?: PollerState;
};

export function isTelegramPollingEnabled(): boolean {
  return process.env.TELEGRAM_POLLING === 'true';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callTelegramApi(
  config: TelegramConfig,
  method: string,
  params: Record<string, unknown>,
  clientTimeoutMs = 15_000,
): Promise<TelegramApiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), clientTimeoutMs);
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${config.botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as TelegramApiBody | null;
    return {
      ok: response.ok && body?.ok !== false,
      status: response.status,
      result: body?.result ?? null,
      errorCode: body?.error_code,
      description: body?.description,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      result: null,
      description: error instanceof Error ? error.message : 'network error',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Telegram rejects getUpdates while a webhook is registered (409). Clear it
 * first so switching prod -> local never needs manual steps.
 */
async function dropWebhook(config: TelegramConfig): Promise<void> {
  const result = await callTelegramApi(config, 'deleteWebhook', {
    drop_pending_updates: true,
  });
  if (!result.ok) {
    console.warn(
      `[telegram-poll] deleteWebhook failed (${result.status}): ${
        result.description ?? 'unknown'
      }`,
    );
  }
}

async function getUpdates(
  config: TelegramConfig,
  offset: number,
): Promise<{ updates: TelegramUpdate[] | null; errorCode?: number }> {
  const result = await callTelegramApi(
    config,
    'getUpdates',
    { offset, timeout: POLL_TIMEOUT_S, allowed_updates: ['callback_query'] },
    CLIENT_TIMEOUT_MS,
  );
  if (!result.ok) {
    return { updates: null, errorCode: result.errorCode ?? result.status };
  }
  return {
    updates: Array.isArray(result.result) ? (result.result as TelegramUpdate[]) : [],
  };
}

async function runPollingLoop(config: TelegramConfig): Promise<void> {
  await dropWebhook(config);
  console.info(
    '[telegram-poll] long polling started — inline buttons are live in local dev.',
  );

  let offset = 0;
  let failures = 0;

  for (;;) {
    const { updates, errorCode } = await getUpdates(config, offset);

    if (updates === null) {
      failures += 1;

      if (errorCode === 401) {
        console.error('[telegram-poll] bot token rejected (401); stopping the poller.');
        return;
      }
      if (errorCode === 409) {
        // A webhook was registered behind our back; clear it and keep polling.
        await dropWebhook(config);
      }

      const delay = Math.min(BASE_BACKOFF_MS * failures, MAX_BACKOFF_MS);
      console.warn(
        `[telegram-poll] getUpdates failed (${errorCode ?? 'network'}); retrying in ${delay}ms`,
      );
      await sleep(delay);
      continue;
    }

    failures = 0;

    for (const update of updates) {
      if (typeof update.update_id === 'number') {
        offset = Math.max(offset, update.update_id + 1);
      }
      try {
        await processTelegramUpdate(config, update);
      } catch (error) {
        console.warn('[telegram-poll] failed to process update', error);
      }
    }
  }
}

/**
 * Starts the local long-polling loop when TELEGRAM_POLLING=true. Wired from
 * `instrumentation.ts` so `pnpm dev` is all you need. Production keeps using the
 * webhook at /api/telegram (Telegram forbids webhook + getUpdates at once).
 */
export function startTelegramPolling(): void {
  if (!isTelegramPollingEnabled()) return;

  const config = getTelegramConfig();
  if (!config) {
    console.warn(
      '[telegram-poll] TELEGRAM_POLLING=true but TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are missing; skipping.',
    );
    return;
  }

  const state = (globalForTelegram.__telegramPoller ??= { started: false });
  if (state.started) return;
  state.started = true;

  void runPollingLoop(config);
}
