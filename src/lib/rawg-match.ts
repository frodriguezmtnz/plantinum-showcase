import type { RawgGame } from '@/lib/rawg-types';

/**
 * Conservative matching for the one-off RAWG backfill.
 *
 * Only an exact match after normalisation is accepted: dropping accents,
 * punctuation and edition/platform suffixes. Anything less certain is left for
 * a human instead of silently linking the wrong game (e.g. "God of War" must
 * NOT match "God of War Ragnarök").
 */

const EDITION_PATTERNS: RegExp[] = [
  /\b(game of the year|goty|definitive|deluxe|ultimate|complete|enhanced|collector['’]?s|gold)\s+edition\b/gi,
  /\bdirector['’]?s cut\b/gi,
  /\bremastered\b/gi,
  /\bremake\b/gi,
  /\b(ps3|ps4|ps5|playstation)\b/gi,
];

export function normalizeGameName(value: string): string {
  let normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  normalized = normalized.toLowerCase().replace(/&/g, ' and ');
  for (const pattern of EDITION_PATTERNS) {
    normalized = normalized.replace(pattern, ' ');
  }
  return normalized
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns the single exact normalised match, or null when ambiguous/missing. */
export function pickRawgMatch(
  gameName: string,
  results: RawgGame[],
): RawgGame | null {
  const target = normalizeGameName(gameName);
  if (!target) return null;
  return results.find((game) => normalizeGameName(game.name) === target) ?? null;
}
