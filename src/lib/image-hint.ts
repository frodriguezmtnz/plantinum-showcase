/**
 * Short, slug-ish alt-text hint derived from the game name (max four words).
 * Kept deterministic so upload and edit produce the same hint for a title.
 */
export function buildImageHint(gameName: string): string {
  return (
    gameName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 4)
      .join("-") || "game screenshot"
  );
}
