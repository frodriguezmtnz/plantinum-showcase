import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildModerationNotice,
  getTelegramConfig,
  parseCallbackData,
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
