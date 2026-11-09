/**
 * RAWG game search (server-only).
 *
 * The API key never leaves the server: the client talks to
 * `/api/games/search`, which calls this module. Without `RAWG_API_KEY` the
 * search is disabled and the upload form keeps its free-text fallback.
 *
 * RAWG's free tier is small (20k requests/month), so repeated queries are
 * cached in-process for a day. The cache is per serverless instance, which is
 * enough to absorb debounced typing without becoming a source of truth.
 */

import type { RawgGame } from './rawg-types';

export type { RawgGame } from './rawg-types';

const RAWG_BASE_URL =
  process.env.RAWG_API_URL?.replace(/\/+$/, '') || 'https://api.rawg.io/api';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = 6000;

interface CacheEntry {
  expiresAt: number;
  results: RawgGame[];
}

const cache = new Map<string, CacheEntry>();

function apiKey(): string | undefined {
  const key = process.env.RAWG_API_KEY?.trim();
  return key || undefined;
}

export function isRawgConfigured(): boolean {
  return Boolean(apiKey());
}

/** Drops the in-process cache (tests and manual refreshes). */
export function clearRawgCache(): void {
  cache.clear();
}

interface RawgResponse {
  results?: Array<{
    id?: unknown;
    name?: unknown;
    slug?: unknown;
    released?: unknown;
    background_image?: unknown;
  }>;
}

function toRawgGame(row: NonNullable<RawgResponse['results']>[number]): RawgGame | null {
  if (typeof row.id !== 'number' || !Number.isInteger(row.id) || row.id <= 0) {
    return null;
  }
  if (typeof row.name !== 'string' || row.name.trim().length === 0) {
    return null;
  }
  return {
    id: row.id,
    name: row.name.trim(),
    slug: typeof row.slug === 'string' ? row.slug : '',
    released: typeof row.released === 'string' && row.released ? row.released : null,
    backgroundImage:
      typeof row.background_image === 'string' && row.background_image
        ? row.background_image
        : null,
  };
}

function pruneCache(now: number) {
  if (cache.size < CACHE_MAX_ENTRIES) return;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  // Still too big: drop the oldest insertion (Map keeps insertion order).
  while (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Search RAWG by title. Returns an empty array when the key is missing, the
 * query is too short, or the API fails — the form degrades to free text.
 */
export async function searchGames(query: string): Promise<RawgGame[]> {
  const key = apiKey();
  const trimmed = query.trim();
  if (!key || trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.results;

  const url = new URL(`${RAWG_BASE_URL}/games`);
  url.searchParams.set('key', key);
  url.searchParams.set('search', trimmed);
  url.searchParams.set('page_size', '8');
  url.searchParams.set('ordering', '-added');

  let results: RawgGame[] = [];
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // Keep the keyed URL out of Next's shared fetch cache; the in-process
      // Map above already absorbs repeated queries.
      cache: 'no-store',
    });
    if (!response.ok) {
      // Never log the URL: it carries the API key.
      console.warn(`[rawg] search failed with ${response.status}`);
      return [];
    }
    const payload = (await response.json()) as RawgResponse;
    results = (payload.results ?? [])
      .map(toRawgGame)
      .filter((game): game is RawgGame => game !== null);
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    if (name !== 'AbortError' && name !== 'TimeoutError') {
      console.warn('[rawg] search request failed', name);
    }
    return [];
  }

  pruneCache(now);
  cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, results });
  return results;
}
