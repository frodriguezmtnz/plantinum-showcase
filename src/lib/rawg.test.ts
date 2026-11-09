import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearRawgCache,
  isRawgConfigured,
  searchGames,
  searchGamesWithStatus,
} from '@/lib/rawg';

const originalFetch = global.fetch;
const originalKey = process.env.RAWG_API_KEY;

function jsonResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

describe('rawg search', () => {
  beforeEach(() => {
    clearRawgCache();
    delete process.env.RAWG_API_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
    if (originalKey === undefined) delete process.env.RAWG_API_KEY;
    else process.env.RAWG_API_KEY = originalKey;
  });

  it('is disabled without a key and never calls the network', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(isRawgConfigured()).toBe(false);
    await expect(searchGames('Elden Ring')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps and sanitises RAWG results', async () => {
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            id: 326243,
            name: 'Elden Ring',
            slug: 'elden-ring',
            released: '2022-02-25',
            background_image: 'https://media.rawg.io/elden.jpg',
          },
          { id: 'not-a-number', name: 'Broken' },
          { id: 1, name: '   ' },
        ],
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const results = await searchGames('  Elden Ring  ');
    expect(results).toEqual([
      {
        id: 326243,
        name: 'Elden Ring',
        slug: 'elden-ring',
        released: '2022-02-25',
        backgroundImage: 'https://media.rawg.io/elden.jpg',
      },
    ]);

    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain('search=Elden+Ring');
    expect(calledUrl).toContain('key=test-key');
  });

  it('caches repeated queries for the same instance', async () => {
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ results: [] }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchGames('Hollow Knight');
    await searchGames('hollow knight');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('degrades to an empty list on API errors', async () => {
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({}, false, 500));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchGames('Bloodborne')).resolves.toEqual([]);
  });

  it('signals upstream failures and never caches them as no matches', async () => {
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false, 502))
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              id: 37127,
              name: 'Bloodborne',
              slug: 'bloodborne',
              released: '2015-03-24',
              background_image: null,
            },
          ],
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchGamesWithStatus('Bloodborne')).resolves.toEqual({
      results: [],
      ok: false,
    });

    const recovered = await searchGamesWithStatus('Bloodborne');
    expect(recovered.ok).toBe(true);
    expect(recovered.results[0]?.name).toBe('Bloodborne');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores queries shorter than two characters', async () => {
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchGames(' E ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
