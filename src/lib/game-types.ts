/**
 * Client-safe game suggestion contract shared by the search API and the
 * combobox. Kept free of server-only imports so it can be bundled in the
 * browser.
 */
export type GameProvider = 'rawg' | 'igdb';

export interface GameSuggestion {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  backgroundImage: string | null;
  provider: GameProvider;
}

export interface GameSearchResult {
  results: GameSuggestion[];
  ok: boolean;
}
