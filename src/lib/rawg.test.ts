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
    vi.useRealTimers();
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

  it('opens the breaker after two failures and fails fast without fetching', async () => {
    vi.useFakeTimers();
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false, 522))
      .mockResolvedValueOnce(jsonResponse({}, false, 522));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    await expect(searchGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Breaker is open: no network call, instant failure.
    await expect(searchGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // After the window it tries RAWG again and recovers.
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ results: [{ id: 1, name: 'Hades' }] }),
    );
    vi.advanceTimersByTime(31_000);
    const recovered = await searchGamesWithStatus('Hades');
    expect(recovered.ok).toBe(true);
    expect(recovered.results[0]?.name).toBe('Hades');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('still serves cached results while the breaker is open', async () => {
    vi.useFakeTimers();
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: 1, name: 'Celeste' }] }),
      )
      .mockResolvedValue(jsonResponse({}, false, 522));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      searchGamesWithStatus('Celeste'),
    ).resolves.toMatchObject({ ok: true });

    await searchGamesWithStatus('Hollow');
    await searchGamesWithStatus('Hollow');
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const cached = await searchGamesWithStatus('Celeste');
    expect(cached.ok).toBe(true);
    expect(cached.results[0]?.name).toBe('Celeste');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('caches empty results briefly instead of a full day', async () => {
    vi.useFakeTimers();
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ results: [] }))
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: 7, name: 'Limbo' }] }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchGamesWithStatus('Limbo');
    // Immediate repeat is served from cache.
    await searchGamesWithStatus('Limbo');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The short empty TTL expires and the query is retried.
    vi.advanceTimersByTime(61_000);
    const refreshed = await searchGamesWithStatus('Limbo');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(refreshed.ok).toBe(true);
    expect(refreshed.results[0]?.name).toBe('Limbo');
  });

  it('keeps non-empty results cached for a day', async () => {
    vi.useFakeTimers();
    process.env.RAWG_API_KEY = 'test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ results: [{ id: 9, name: 'Undertale' }] }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    await searchGamesWithStatus('Undertale');
    vi.advanceTimersByTime(60 * 60 * 1000);
    await searchGamesWithStatus('Undertale');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
