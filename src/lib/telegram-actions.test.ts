import { beforeEach, describe, expect, it, vi } from 'vitest';
import { answerCallbackQuery, type TelegramConfig } from '@/lib/telegram';
import {
  processTelegramUpdate,
  type TelegramUpdate,
} from '@/lib/telegram-actions';
import {
  applyPlatinumModeration,
  applyReportDecision,
} from '@/lib/moderation-core';

vi.mock('@/lib/moderation-core', () => ({
  applyPlatinumModeration: vi.fn(),
  applyReportDecision: vi.fn(),
}));

vi.mock('@/lib/telegram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/telegram')>();
  return { ...actual, answerCallbackQuery: vi.fn(async () => true) };
});

const config: TelegramConfig = {
  botToken: 'token',
  chatId: '42',
  siteUrl: 'https://example.com',
};

const modMock = vi.mocked(applyPlatinumModeration);
const reportMock = vi.mocked(applyReportDecision);
const answerMock = vi.mocked(answerCallbackQuery);

function callbackUpdate(data: string, chatId: string | number = '42'): TelegramUpdate {
  return {
    update_id: 1,
    callback_query: {
      id: 'cb1',
      data,
      message: { chat: { id: chatId } },
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('processTelegramUpdate', () => {
  it('ignores updates without a callback query', async () => {
    const outcome = await processTelegramUpdate(config, { update_id: 9 });
    expect(outcome).toEqual({ handled: false, success: false, reply: '' });
    expect(answerMock).not.toHaveBeenCalled();
    expect(modMock).not.toHaveBeenCalled();
  });

  it('rejects callbacks coming from another chat', async () => {
    const outcome = await processTelegramUpdate(config, callbackUpdate('MOD:p1:hide', '99'));
    expect(outcome).toEqual({ handled: true, success: false, reply: 'Not allowed' });
    expect(answerMock).toHaveBeenCalledWith(config, 'cb1', 'Not allowed');
    expect(modMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported callback data', async () => {
    const outcome = await processTelegramUpdate(config, callbackUpdate('NOPE'));
    expect(outcome).toEqual({
      handled: true,
      success: false,
      reply: 'Unsupported action',
    });
    expect(answerMock).toHaveBeenCalledWith(config, 'cb1', 'Unsupported action');
    expect(modMock).not.toHaveBeenCalled();
  });

  it('applies platinum moderation and replies done', async () => {
    modMock.mockResolvedValue({ success: true });

    const outcome = await processTelegramUpdate(config, callbackUpdate('MOD:p1:hide'));

    expect(modMock).toHaveBeenCalledWith('p1', 'HIDDEN');
    expect(reportMock).not.toHaveBeenCalled();
    expect(answerMock).toHaveBeenCalledWith(config, 'cb1', 'Done ✅');
    expect(outcome).toEqual({ handled: true, success: true, reply: 'Done ✅' });
  });

  it('applies report decisions', async () => {
    reportMock.mockResolvedValue({ success: true });

    const outcome = await processTelegramUpdate(config, callbackUpdate('RPT:r1:delete'));

    expect(reportMock).toHaveBeenCalledWith('r1', 'delete');
    expect(modMock).not.toHaveBeenCalled();
    expect(outcome.success).toBe(true);
  });

  it('surfaces moderation errors back to Telegram', async () => {
    modMock.mockResolvedValue({
      success: false,
      error: 'This platinum does not exist.',
    });

    const outcome = await processTelegramUpdate(config, callbackUpdate('MOD:gone:publish'));

    expect(answerMock).toHaveBeenCalledWith(
      config,
      'cb1',
      'This platinum does not exist.',
    );
    expect(outcome).toEqual({
      handled: true,
      success: false,
      reply: 'This platinum does not exist.',
    });
  });
});
