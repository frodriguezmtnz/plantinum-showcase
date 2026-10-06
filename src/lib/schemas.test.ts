import { describe, expect, it } from 'vitest';
import { platinumMetaInputSchema, platinumMetaSchema } from '@/lib/schemas';

const base = {
  gameName: 'Elden Ring',
  platform: 'PS5' as const,
  platinumDate: new Date('2024-02-01'),
  comment: 'A fine journey',
};

describe('platinumMetaSchema', () => {
  it('accepts valid metadata', () => {
    const parsed = platinumMetaSchema.parse({ ...base, isSpoiler: true });
    expect(parsed.gameName).toBe('Elden Ring');
    expect(parsed.platform).toBe('PS5');
    expect(parsed.isSpoiler).toBe(true);
  });

  it('defaults isSpoiler to false and keeps comment optional', () => {
    const parsed = platinumMetaSchema.parse({
      ...base,
      comment: undefined,
      isSpoiler: undefined,
    });
    expect(parsed.isSpoiler).toBe(false);
    expect(parsed.comment).toBeUndefined();
  });

  it('trims the game name and comment', () => {
    const parsed = platinumMetaSchema.parse({
      ...base,
      gameName: '  Elden Ring  ',
      comment: '  gg  ',
      isSpoiler: false,
    });
    expect(parsed.gameName).toBe('Elden Ring');
    expect(parsed.comment).toBe('gg');
  });

  it('rejects a game name shorter than 5 characters', () => {
    expect(
      platinumMetaSchema.safeParse({ ...base, gameName: 'abc', isSpoiler: false }).success,
    ).toBe(false);
  });

  it('rejects a game name longer than 120 characters', () => {
    expect(
      platinumMetaSchema.safeParse({ ...base, gameName: 'x'.repeat(121), isSpoiler: false })
        .success,
    ).toBe(false);
  });

  it('rejects an unknown platform', () => {
    expect(
      platinumMetaSchema.safeParse({ ...base, platform: 'PS2', isSpoiler: false }).success,
    ).toBe(false);
  });

  it('rejects a comment longer than 500 characters', () => {
    expect(
      platinumMetaSchema.safeParse({ ...base, comment: 'x'.repeat(501), isSpoiler: false })
        .success,
    ).toBe(false);
  });
});

describe('platinumMetaInputSchema', () => {
  it('coerces an ISO string into a Date', () => {
    const parsed = platinumMetaInputSchema.parse({
      ...base,
      platinumDate: '2024-02-01T00:00:00.000Z',
      isSpoiler: false,
    });
    expect(parsed.platinumDate).toBeInstanceOf(Date);
    expect(parsed.platinumDate.toISOString()).toBe('2024-02-01T00:00:00.000Z');
  });
});
