/**
 * IGDB game search (server-only), used as a fallback when RAWG is unavailable.
 *
 * IGDB (Twitch) uses OAuth2 client-credentials and a POST/Apicalypse API, so
 * this module caches the bearer token and the search results in-process. It is
 * optional: without `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` the search is
 * disabled and the aggregator keeps RAWG behaviour untouched.
 *
 * IGDB ids are NOT stored as the plate's canonical `gameId` (that id space is
 * RAWG's); callers treat IGDB hits as manual titles.
 */

const IGDB_BASE_URL = 'https://api.igdb.com/v4';
const IGDB_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const REQUEST_TIMEOUT_MS = Number(process.env.IGDB_TIMEOUT_MS) || 4000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const EMPTY_CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const CIRCUIT_OPEN_MS = 30 * 1000;
const CIRCUIT_FAILURE_THRESHOLD = 2;
const TOKEN_SAFETY_MS = 60 * 1000;

export interface IgdbSearchItem {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  backgroundImage: string | null;
}

export interface IgdbSearchResult {
  results: IgdbSearchItem[];
  ok: boolean;
}

interface CacheEntry {
  expiresAt: number;
  results: IgdbSearchItem[];
}

interface Credentials {
  clientId: string;
  clientSecret: string;
}

interface TokenEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
let token: TokenEntry | null = null;
let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function credentials(): Credentials | null {
  const clientId = process.env.IGDB_CLIENT_ID?.trim();
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isIgdbConfigured(): boolean {
  return credentials() !== null;
}

export function clearIgdbCache(): void {
  cache.clear();
  token = null;
  consecutiveFailures = 0;
  breakerOpenUntil = 0;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : 'UnknownError';
}

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

function pruneCache(now: number): void {
  if (cache.size < CACHE_MAX_ENTRIES) return;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

function sanitize(value: string): string {
  return value
    .replace(/["\\\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

async function getToken(creds: Credentials, now: number): Promise<string | null> {
  if (token && token.expiresAt > now) return token.value;

  const url = new URL(IGDB_TOKEN_URL);
  url.searchParams.set('client_id', creds.clientId);
  url.searchParams.set('client_secret', creds.clientSecret);
  url.searchParams.set('grant_type', 'client_credentials');

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!response.ok) {
      // Never log the URL: it carries the client secret.
      console.warn(`[igdb] token request failed with ${response.status}`);
      return null;
    }
    const payload = (await response.json()) as {
      access_token?: unknown;
      expires_in?: unknown;
    };
    if (typeof payload.access_token !== 'string' || !payload.access_token) {
      return null;
    }
    const ttl =
      typeof payload.expires_in === 'number'
        ? payload.expires_in * 1000
        : 60 * 60 * 1000;
    token = { value: payload.access_token, expiresAt: now + ttl - TOKEN_SAFETY_MS };
    return token.value;
  } catch (error) {
    console.warn('[igdb] token request failed', errorName(error));
    return null;
  }
}

function requestGames(
  tokenValue: string,
  clientId: string,
  body: string,
): Promise<Response> {
  return fetch(`${IGDB_BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${tokenValue}`,
      Accept: 'application/json',
      'Content-Type': 'text/plain',
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    // Keep the keyed request out of Next's shared fetch cache.
    cache: 'no-store',
  });
}

function toItem(row: unknown): IgdbSearchItem | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as {
    id?: unknown;
    name?: unknown;
    slug?: unknown;
    first_release_date?: unknown;
    cover?: { image_id?: unknown };
  };
  if (typeof r.id !== 'number' || !Number.isInteger(r.id) || r.id <= 0) {
    return null;
  }
  if (typeof r.name !== 'string' || r.name.trim().length === 0) {
    return null;
  }
  const released =
    typeof r.first_release_date === 'number'
      ? new Date(r.first_release_date * 1000).toISOString().slice(0, 10)
      : null;
  const imageId =
    r.cover && typeof r.cover.image_id === 'string' ? r.cover.image_id : '';
  return {
    id: r.id,
    name: r.name.trim(),
    slug: typeof r.slug === 'string' ? r.slug : '',
    released,
    backgroundImage: imageId
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`
      : null,
  };
}

function finish(payload: unknown, cacheKey: string, now: number): IgdbSearchResult {
  const rows = Array.isArray(payload) ? payload : [];
  const results = rows
    .map(toItem)
    .filter((game): game is IgdbSearchItem => game !== null);

  recordSuccess();
  pruneCache(now);
  const ttl = results.length > 0 ? CACHE_TTL_MS : EMPTY_CACHE_TTL_MS;
  cache.set(cacheKey, { expiresAt: now + ttl, results });
  return { results, ok: true };
}

/**
 * Search IGDB by title, keeping the failure signal so the aggregator can tell
 * an outage from "no matches".
 */
export async function searchIgdbGamesWithStatus(
  query: string,
): Promise<IgdbSearchResult> {
  const creds = credentials();
  const trimmed = query.trim();
  if (!creds || trimmed.length < 2) return { results: [], ok: false };

  const cacheKey = trimmed.toLowerCase();
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return { results: hit.results, ok: true };
  }

  if (now < breakerOpenUntil) {
    return { results: [], ok: false };
  }

  const tokenValue = await getToken(creds, now);
  if (!tokenValue) {
    recordFailure(Date.now());
    return { results: [], ok: false };
  }

  const body = `search "${sanitize(trimmed)}"; fields id,name,slug,first_release_date,cover.image_id; limit 8;`;

  try {
    let response = await requestGames(tokenValue, creds.clientId, body);
    if (response.status === 401) {
      // Token expired early: drop it and retry once with a fresh one.
      token = null;
      const retryToken = await getToken(creds, Date.now());
      if (!retryToken) {
        recordFailure(Date.now());
        return { results: [], ok: false };
      }
      response = await requestGames(retryToken, creds.clientId, body);
    }
    if (!response.ok) {
      console.warn(`[igdb] search failed with ${response.status}`);
      recordFailure(Date.now());
      return { results: [], ok: false };
    }
    return finish(await response.json(), cacheKey, now);
  } catch (error) {
    const name = errorName(error);
    if (name !== 'AbortError' && name !== 'TimeoutError') {
      console.warn('[igdb] search request failed', name);
    }
    recordFailure(Date.now());
    return { results: [], ok: false };
  }
}
