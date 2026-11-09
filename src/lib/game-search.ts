/**
 * Provider-agnostic game search.
 *
 * RAWG is the primary source (its ids are the canonical `gameId`). When RAWG
 * is configured but fails — an outage, not "no matches" — we fall back to
 * IGDB so the autocomplete keeps working. IGDB hits are suggestions only: they
 * carry their own id space, so callers treat them as manual titles instead of
 * storing the id as a RAWG `gameId`.
 */

import type { GameProvider, GameSearchResult, GameSuggestion } from './game-types';
import { clearIgdbCache, isIgdbConfigured, searchIgdbGamesWithStatus } from './igdb';
import { clearRawgCache, isRawgConfigured, searchGamesWithStatus as searchRawg } from './rawg';

export type { GameProvider, GameSearchResult, GameSuggestion } from './game-types';

export function isGameSearchConfigured(): boolean {
  return isRawgConfigured() || isIgdbConfigured();
}

function withProvider(
  results: Array<Omit<GameSuggestion, 'provider'>>,
  provider: GameProvider,
): GameSuggestion[] {
  return results.map((game) => ({ ...game, provider }));
}

/**
 * Search RAWG first; if it is configured but unavailable, try IGDB. An empty
 * but successful RAWG response is respected (no fallback): the game genuinely
 * has no matches.
 */
export async function searchGamesWithStatus(
  query: string,
): Promise<GameSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { results: [], ok: false };

  if (isRawgConfigured()) {
    const rawg = await searchRawg(trimmed);
    if (rawg.ok) {
      return { results: withProvider(rawg.results, 'rawg'), ok: true };
    }
  }

  if (isIgdbConfigured()) {
    const igdb = await searchIgdbGamesWithStatus(trimmed);
    if (igdb.ok) {
      return { results: withProvider(igdb.results, 'igdb'), ok: true };
    }
  }

  return { results: [], ok: false };
}

/** Drops both providers' in-process caches (tests and manual refreshes). */
export function clearGameSearchCache(): void {
  clearRawgCache();
  clearIgdbCache();
}
