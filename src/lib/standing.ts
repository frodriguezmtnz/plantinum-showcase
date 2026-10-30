/**
 * Percentile copy for the profile's standing card. Below this board size a
 * percentage is noise ("ahead of 67% of five hunters"), so it is hidden.
 */
export const MIN_STANDING_HUNTERS = 10;

export interface StandingInput {
  hunters: number;
  below: number;
}

/**
 * Share of the board this hunter is ahead of. Uses strict "fewer than"
 * counts, so ties never inflate the number; returns null when the board is
 * still too small to be meaningful.
 */
export function aheadOfPercent({ hunters, below }: StandingInput): number | null {
  if (hunters < MIN_STANDING_HUNTERS) return null;
  const safeBelow = Math.min(Math.max(below, 0), hunters);
  return Math.round((safeBelow / hunters) * 100);
}

/** `false` when the hunter is at the very bottom, so the copy can be kinder. */
export function hasHuntersBehind(below: number): boolean {
  return below > 0;
}
