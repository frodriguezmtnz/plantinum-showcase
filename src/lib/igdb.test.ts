import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearIgdbCache,
  isIgdbConfigured,
  searchIgdbGamesWithStatus,
} from '@/lib/igdb';

const originalFetch = global.fetch;
const originalId = process.env.IGDB_CLIENT_ID;
const originalSecret = process.env.IGDB_CLIENT_SECRET;

function jsonResponse(payload: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

const TOKEN = jsonResponse({ access_token: 'tok', expires_in: 3600 });

describe('igdb search', () => {
  beforeEach(() => {
    clearIgdbCache();
    process.env.IGDB_CLIENT_ID = 'cid';
    process.env.IGDB_CLIENT_SECRET = 'secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalId === undefined) delete process.env.IGDB_CLIENT_ID;
    else process.env.IGDB_CLIENT_ID = originalId;
    if (originalSecret === undefined) delete process.env.IGDB_CLIENT_SECRET;
    else process.env.IGDB_CLIENT_SECRET = originalSecret;
  });

  it('is disabled without credentials and never calls the network', async () => {
    delete process.env.IGDB_CLIENT_ID;
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    expect(isIgdbConfigured()).toBe(false);
    await expect(searchIgdbGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches a token, maps results and caches the query', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(TOKEN)
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1029,
            name: 'Hades',
            slug: 'hades',
            first_release_date: 1600646400,
            cover: { image_id: 'co1abc' },
          },
          { id: 'bad', name: 'nope' },
        ]),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await searchIgdbGamesWithStatus('  Hades  ');
    expect(result.ok).toBe(true);
    expect(result.results).toEqual([
      {
        id: 1029,
        name: 'Hades',
        slug: 'hades',
        released: '2020-09-21',
        backgroundImage:
          'https://images.igdb.com/igdb/image/upload/t_cover_big/co1abc.jpg',
      },
    ]);

    const [, gamesInit] = fetchMock.mock.calls[1] ?? [];
    expect(gamesInit).toMatchObject({
      method: 'POST',
      headers: {
        'Client-ID': 'cid',
        Authorization: 'Bearer tok',
      },
    });
    expect(String(gamesInit?.body)).toContain('search "Hades"');

    // Token and query are cached: no further network calls.
    await searchIgdbGamesWithStatus('hades');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('signals failures and opens the breaker after two consecutive errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(TOKEN)
      .mockResolvedValueOnce(jsonResponse({}, false, 500))
      .mockResolvedValueOnce(jsonResponse({}, false, 500));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(searchIgdbGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    await expect(searchIgdbGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    // Breaker open: no network call even though the cache missed.
    await expect(searchIgdbGamesWithStatus('Hades')).resolves.toEqual({
      results: [],
      ok: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('refreshes an expired token once on a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(TOKEN)
      .mockResolvedValueOnce(jsonResponse({}, false, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'tok2', expires_in: 3600 }))
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'Hades' }]));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await searchIgdbGamesWithStatus('Hades');
    expect(result.ok).toBe(true);
    expect(result.results[0]?.name).toBe('Hades');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
