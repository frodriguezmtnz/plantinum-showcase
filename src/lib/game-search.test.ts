import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/rawg', () => ({
  isRawgConfigured: vi.fn(),
  searchGamesWithStatus: vi.fn(),
  clearRawgCache: vi.fn(),
}));

vi.mock('@/lib/igdb', () => ({
  isIgdbConfigured: vi.fn(),
  searchIgdbGamesWithStatus: vi.fn(),
  clearIgdbCache: vi.fn(),
}));

import { searchGamesWithStatus } from '@/lib/game-search';
import {
  isIgdbConfigured,
  searchIgdbGamesWithStatus,
} from '@/lib/igdb';
import {
  isRawgConfigured,
  searchGamesWithStatus as searchRawg,
} from '@/lib/rawg';

const rawgItem = {
  id: 1,
  name: 'Hades',
  slug: 'hades',
  released: null,
  backgroundImage: null,
};

const igdbItem = {
  id: 2,
  name: 'Hades II',
  slug: 'hades-ii',
  released: null,
  backgroundImage: null,
};

describe('game search aggregator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isRawgConfigured).mockReturnValue(true);
    vi.mocked(isIgdbConfigured).mockReturnValue(true);
  });

  it('returns RAWG results when RAWG is healthy and never calls IGDB', async () => {
    vi.mocked(searchRawg).mockResolvedValue({ results: [rawgItem], ok: true });

    const result = await searchGamesWithStatus('Hades');

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([{ ...rawgItem, provider: 'rawg' }]);
    expect(searchIgdbGamesWithStatus).not.toHaveBeenCalled();
  });

  it('falls back to IGDB when RAWG is unavailable', async () => {
    vi.mocked(searchRawg).mockResolvedValue({ results: [], ok: false });
    vi.mocked(searchIgdbGamesWithStatus).mockResolvedValue({
      results: [igdbItem],
      ok: true,
    });

    const result = await searchGamesWithStatus('Hades');

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([{ ...igdbItem, provider: 'igdb' }]);
  });

  it('respects an empty but successful RAWG response (no fallback)', async () => {
    vi.mocked(searchRawg).mockResolvedValue({ results: [], ok: true });

    await expect(searchGamesWithStatus('zzzz')).resolves.toEqual({
      results: [],
      ok: true,
    });
    expect(searchIgdbGamesWithStatus).not.toHaveBeenCalled();
  });

  it('reports unavailable when both providers fail', async () => {
    vi.mocked(searchRawg).mockResolvedValue({ results: [], ok: false });
    vi.mocked(searchIgdbGamesWithStatus).mockResolvedValue({
      results: [],
      ok: false,
    });

    await expect(searchGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
  });

  it('uses IGDB directly when only IGDB is configured', async () => {
    vi.mocked(isRawgConfigured).mockReturnValue(false);
    vi.mocked(searchIgdbGamesWithStatus).mockResolvedValue({
      results: [igdbItem],
      ok: true,
    });

    const result = await searchGamesWithStatus('Hades');

    expect(result.results).toEqual([{ ...igdbItem, provider: 'igdb' }]);
    expect(searchRawg).not.toHaveBeenCalled();
  });

  it('ignores queries shorter than two characters', async () => {
    await expect(searchGamesWithStatus(' a ')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(searchRawg).not.toHaveBeenCalled();
    expect(searchIgdbGamesWithStatus).not.toHaveBeenCalled();
  });
});
