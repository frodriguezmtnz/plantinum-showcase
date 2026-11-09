/**
 * RAWG game search (server-only).
 *
 * The API key never leaves the server: the client talks to
 * `/api/games/search`, which calls this module. Without `RAWG_API_KEY` the
 * search is disabled and the upload form keeps its free-text fallback.
 *
 * RAWG's free tier is small (20k requests/month), so repeated queries are
 * cached in-process for a day (empty results only briefly). The cache is per
 * serverless instance, which is enough to absorb debounced typing without
 * becoming a source of truth. Repeated upstream failures open a short circuit
 * breaker so an outage does not make every keystroke wait for the timeout.
 */

import type { RawgGame } from './rawg-types';

export type { RawgGame } from './rawg-types';

const RAWG_BASE_URL =
  process.env.RAWG_API_URL?.replace(/\/+$/, '') || 'https://api.rawg.io/api';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// A transient empty 200 is not "no matches forever": keep it briefly.
const EMPTY_CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const REQUEST_TIMEOUT_MS = Number(process.env.RAWG_TIMEOUT_MS) || 3000;
// Upstream outages shouldn't make every keystroke wait for the timeout.
const CIRCUIT_OPEN_MS = 30 * 1000;
const CIRCUIT_FAILURE_THRESHOLD = 2;

interface CacheEntry {
  expiresAt: number;
  results: RawgGame[];
}

export interface RawgSearchResult {
  results: RawgGame[];
  /** False when the key is missing, the query is too short, or RAWG failed. */
  ok: boolean;
}

const cache = new Map<string, CacheEntry>();

let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function recordFailure(now: number): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    breakerOpenUntil = now + CIRCUIT_OPEN_MS;
  }
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  breakerOpenUntil = 0;
}

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
  consecutiveFailures = 0;
  breakerOpenUntil = 0;
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
 * Search RAWG by title and keep the failure signal, so callers can avoid
 * caching an outage as if it were "no matches".
 */
export async function searchGamesWithStatus(
  query: string,
): Promise<RawgSearchResult> {
  const key = apiKey();
  const trimmed = query.trim();
  if (!key || trimmed.length < 2) return { results: [], ok: false };

  const cacheKey = trimmed.toLowerCase();
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return { results: hit.results, ok: true };
  }

  // While the breaker is open, fail fast instead of awaiting another timeout.
  if (now < breakerOpenUntil) {
    return { results: [], ok: false };
  }

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
      recordFailure(Date.now());
      return { results: [], ok: false };
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
    recordFailure(Date.now());
    return { results: [], ok: false };
  }

  recordSuccess();
  pruneCache(now);
  const ttl = results.length > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS;
  cache.set(cacheKey, { expiresAt: now + ttl, results });
  return { results, ok: true };
}

/**
 * Search RAWG by title. Returns an empty array when the key is missing, the
 * query is too short, or the API fails — the form degrades to free text.
 */
export async function searchGames(query: string): Promise<RawgGame[]> {
  return (await searchGamesWithStatus(query)).results;
}
