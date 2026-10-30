/**
 * PlayStation-like handle policy: one change per 12 months. Kept isomorphic so
 * both the server action and the Settings form can show the same next date.
 */

export const USERNAME_COOLDOWN_MONTHS = 12;

export function nextUsernameChangeAt(lastChangedAt: Date | string): Date {
  const next = new Date(lastChangedAt);
  next.setUTCMonth(next.getUTCMonth() + USERNAME_COOLDOWN_MONTHS);
  return next;
}

export interface UsernameCooldown {
  locked: boolean;
  nextAt: Date | null;
}

export function usernameCooldownStatus(
  lastChangedAt: Date | string | null | undefined,
  now: Date = new Date(),
): UsernameCooldown {
  if (!lastChangedAt) return { locked: false, nextAt: null };

  const nextAt = nextUsernameChangeAt(lastChangedAt);
  return { locked: now.getTime() < nextAt.getTime(), nextAt };
}

/** UTC, deterministic on server and client. */
export function formatUsernameChangeDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
