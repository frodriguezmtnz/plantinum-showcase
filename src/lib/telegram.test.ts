import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildModerationNotice,
  getTelegramConfig,
  parseCallbackData,
  sendModerationNotice,
  truncateMessage,
  type ModerationNotice,
} from '@/lib/telegram';

const ENV_KEYS = [
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'NEXT_PUBLIC_SITE_URL',
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) saved[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function configureTelegram() {
  process.env.TELEGRAM_BOT_TOKEN = 'token';
  process.env.TELEGRAM_CHAT_ID = '42';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
}

describe('getTelegramConfig', () => {
  it('returns null when the token or chat id is missing', () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    expect(getTelegramConfig()).toBeNull();
  });

  it('reads the config and trims the trailing slash from the site url', () => {
    configureTelegram();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
    expect(getTelegramConfig()).toEqual({
      botToken: 'token',
      chatId: '42',
      siteUrl: 'https://example.com',
    });
  });
});

describe('buildModerationNotice', () => {
  beforeEach(configureTelegram);

  it('builds an upload alert with plate links and moderation buttons', () => {
    const { text, keyboard } = buildModerationNotice({
      source: 'upload',
      platinumId: 'p1',
      gameName: 'Elden Ring',
      ownerUsername: 'alice',
      label: 'UNSAFE',
      category: 'spam',
      confidence: 0.92,
      summary: 'Looks like an ad.',
      moderationStatus: 'UNDER_REVIEW',
    });

    expect(text).toContain('Elden Ring');
    expect(text).toContain('@alice');
    expect(text).toContain('UNSAFE');
    expect(text).toContain('92%');
    expect(text).toContain('Looks like an ad.');

    const buttons = keyboard.inline_keyboard.flat();
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: 'https://example.com/platinum/p1' }),
        expect.objectContaining({ callback_data: 'MOD:p1:publish' }),
        expect.objectContaining({ callback_data: 'MOD:p1:hide' }),
        expect.objectContaining({ callback_data: 'MOD:p1:delete' }),
      ]),
    );
  });

  it('omits link buttons for a local site url (Telegram rejects them)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9002';

    const { keyboard } = buildModerationNotice({
      source: 'upload',
      platinumId: 'p1',
      gameName: 'Elden Ring',
      ownerUsername: 'alice',
      label: 'REVIEW',
      category: null,
      confidence: null,
      summary: null,
      moderationStatus: 'UNDER_REVIEW',
    });

    const buttons = keyboard.inline_keyboard.flat();
    expect(buttons.some((button) => 'url' in button)).toBe(false);
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ callback_data: 'MOD:p1:publish' }),
      ]),
    );
  });

  it('builds a manual-review notice when the AI is unconfigured', () => {
    const { text, keyboard } = buildModerationNotice({
      source: 'upload',
      platinumId: 'p1',
      gameName: 'Elden Ring',
      ownerUsername: 'alice',
      label: 'REVIEW',
      category: null,
      confidence: null,
      summary: 'AI screening is not configured; manual review required.',
      moderationStatus: 'UNDER_REVIEW',
      manual: true,
    });

    expect(text).toContain('Revisión manual requerida');
    expect(text).toContain('IA no configurada');
    expect(text).not.toContain('marcado por la IA');

    const buttons = keyboard.inline_keyboard.flat();
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ callback_data: 'MOD:p1:publish' }),
      ]),
    );
  });

  it('builds a report alert with report details and report buttons', () => {
    const { text, keyboard } = buildModerationNotice({
      source: 'report',
      platinumId: 'p2',
      gameName: 'Cyberpunk 2077',
      ownerUsername: 'bob',
      label: 'REVIEW',
      category: null,
      confidence: 0.5,
      summary: null,
      moderationStatus: 'UNDER_REVIEW',
      reportId: 'r2',
      reportReason: 'SPAM',
      reportMessage: 'spam link',
      reporterUsername: 'carol',
    });

    expect(text).toContain('Report');
    expect(text).toContain('spam link');
    expect(text).toContain('@carol');

    const buttons = keyboard.inline_keyboard.flat();
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ callback_data: 'RPT:r2:dismiss' }),
        expect.objectContaining({ callback_data: 'RPT:r2:hide' }),
        expect.objectContaining({ callback_data: 'RPT:r2:delete' }),
      ]),
    );
  });

  it('builds an appeal alert with restore buttons for the plate', () => {
    const { text, keyboard } = buildModerationNotice({
      source: 'appeal',
      platinumId: 'p3',
      gameName: 'Bloodborne',
      ownerUsername: 'dave',
      label: 'REVIEW',
      category: 'appeal',
      confidence: null,
      summary: 'Owner appeal: it was just the HUD',
      moderationStatus: 'HIDDEN',
      reportId: 'r3',
      reportReason: 'APPEAL',
      reportMessage: 'it was just the HUD',
      reporterUsername: 'dave',
    });

    expect(text).toContain('Apelación del autor');
    expect(text).toContain('Author appeal');
    expect(text).toContain('it was just the HUD');

    const buttons = keyboard.inline_keyboard.flat();
    expect(buttons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ callback_data: 'MOD:p3:publish' }),
        expect.objectContaining({ callback_data: 'MOD:p3:hide' }),
      ]),
    );
  });
});

describe('truncateMessage', () => {
  it('leaves short messages untouched', () => {
    expect(truncateMessage('hola')).toBe('hola');
    expect(truncateMessage('a'.repeat(4096))).toHaveLength(4096);
  });

  it('cuts long messages below the limit and marks the cut', () => {
    const text = ['line one', 'x'.repeat(5000), 'line three'].join('\n');
    const result = truncateMessage(text);
    expect(result.length).toBeLessThanOrEqual(4096);
    expect(result.endsWith('…')).toBe(true);
    expect(result.startsWith('line one')).toBe(true);
  });

  it('never cuts through an HTML entity or an opening tag', () => {
    const entity = `${'a'.repeat(4085)} &amp; rest`;
    const entityResult = truncateMessage(entity);
    expect(entityResult).not.toMatch(/&[a-z]*$/);

    const tag = `${'a'.repeat(4080)} <b>bold text</b>`;
    const tagResult = truncateMessage(tag);
    expect(tagResult).not.toMatch(/<[^>]*$/);
  });
});

describe('sendModerationNotice', () => {
  const notice: ModerationNotice = {
    source: 'upload',
    platinumId: 'p1',
    gameName: 'Elden Ring',
    ownerUsername: 'alice',
    label: 'UNSAFE',
    category: 'spam',
    confidence: 0.9,
    summary: 'Looks like an ad.',
    moderationStatus: 'UNDER_REVIEW',
  };

  beforeEach(() => {
    configureTelegram();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('posts an HTML message and reports success', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 1 } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendModerationNotice(notice)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toContain('/bottoken/sendMessage');
    const body = JSON.parse(init.body as string);
    expect(body.chat_id).toBe('42');
    expect(body.parse_mode).toBe('HTML');
  });

  it('logs the Telegram description and returns false on rejection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({
          ok: false,
          error_code: 400,
          description: 'Bad Request: chat not found',
        }),
      })),
    );

    await expect(sendModerationNotice(notice)).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Bad Request: chat not found'),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('platinum=p1'),
    );
    warn.mockRestore();
  });

  it('retries once when Telegram rate limits the send', async () => {
    vi.useFakeTimers();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          ok: false,
          error_code: 429,
          description: 'Too Many Requests: retry after 1',
          parameters: { retry_after: 1 },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: { message_id: 2 } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const promise = sendModerationNotice(notice);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('truncates very long notices before sending', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    await sendModerationNotice({ ...notice, summary: 'y'.repeat(6000) });

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string);
    expect(body.text.length).toBeLessThanOrEqual(4096);
  });
});

describe('parseCallbackData', () => {
  it('parses platinum moderation actions', () => {
    expect(parseCallbackData('MOD:abc:publish')).toEqual({
      kind: 'platinum',
      id: 'abc',
      op: 'PUBLISHED',
    });
    expect(parseCallbackData('MOD:abc:hide')).toEqual({
      kind: 'platinum',
      id: 'abc',
      op: 'HIDDEN',
    });
    expect(parseCallbackData('MOD:abc:delete')).toEqual({
      kind: 'platinum',
      id: 'abc',
      op: 'DELETE',
    });
  });

  it('parses report decisions', () => {
    expect(parseCallbackData('RPT:abc:dismiss')).toEqual({
      kind: 'report',
      id: 'abc',
      decision: 'dismiss',
    });
    expect(parseCallbackData('RPT:abc:hide')).toEqual({
      kind: 'report',
      id: 'abc',
      decision: 'hide',
    });
    expect(parseCallbackData('RPT:abc:delete')).toEqual({
      kind: 'report',
      id: 'abc',
      decision: 'delete',
    });
  });

  it('rejects unknown or malformed data', () => {
    expect(parseCallbackData(undefined)).toBeNull();
    expect(parseCallbackData('')).toBeNull();
    expect(parseCallbackData('MOD:abc')).toBeNull();
    expect(parseCallbackData('XXX:abc:publish')).toBeNull();
    expect(parseCallbackData('MOD:abc:explode')).toBeNull();
  });
});
