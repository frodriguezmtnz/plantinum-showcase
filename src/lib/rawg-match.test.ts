import { describe, expect, it } from 'vitest';
import { normalizeGameName, pickRawgMatch } from '@/lib/rawg-match';
import type { RawgGame } from '@/lib/rawg-types';

function game(id: number, name: string): RawgGame {
  return {
    id,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    released: null,
    backgroundImage: null,
  };
}

describe('normalizeGameName', () => {
  it('drops accents, punctuation and case', () => {
    expect(normalizeGameName('God of War: Ragnarök')).toBe(
      'god of war ragnarok',
    );
    expect(normalizeGameName('Marvel’s Spider-Man')).toBe(
      'marvel s spider man',
    );
  });

  it('strips edition and platform suffixes', () => {
    expect(normalizeGameName('The Last of Us Part II Remastered')).toBe(
      'the last of us part ii',
    );
    expect(normalizeGameName('Bloodborne Game of the Year Edition')).toBe(
      'bloodborne',
    );
    expect(normalizeGameName('Ghost of Tsushima Director’s Cut PS5')).toBe(
      'ghost of tsushima',
    );
  });

  it('normalises ampersands', () => {
    expect(normalizeGameName('Ratchet & Clank')).toBe('ratchet and clank');
  });
});

describe('pickRawgMatch', () => {
  it('links an exact normalised match', () => {
    const results = [game(1, 'Elden Ring'), game(2, 'Elden Ring: Shadow of the Erdtree')];
    expect(pickRawgMatch('ELDEN RING', results)?.id).toBe(1);
  });

  it('never links a shorter title to a longer sequel', () => {
    const results = [game(2, 'God of War Ragnarök')];
    expect(pickRawgMatch('God of War', results)).toBeNull();
  });

  it('returns null when there is no match', () => {
    expect(pickRawgMatch('Unknown Indie Game', [game(1, 'Elden Ring')])).toBeNull();
  });
});
