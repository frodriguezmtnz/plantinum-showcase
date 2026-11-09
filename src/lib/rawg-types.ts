/**
 * Plain data contract shared by the server RAWG client and the client-side
 * combobox. Kept separate so importing the type never pulls server-only code
 * into the browser bundle.
 */
export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  released: string | null;
  backgroundImage: string | null;
}
