/**
 * Handle rules shared by registration and /settings. Keeping them in one
 * module means the live availability probe and the write path can never drift.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Handles we never hand out (impersonation / brand / infra). */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'admin',
  'administrator',
  'support',
  'moderator',
  'staff',
  'platinum',
  'showcase',
  'system',
  'official',
  'root',
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export type UsernameProblem = 'too-short' | 'too-long' | 'charset' | 'reserved';

/**
 * Returns the first shape problem, or null when the handle is well formed.
 * Uniqueness is a database concern and is checked separately.
 */
export function usernameProblem(username: string): UsernameProblem | null {
  if (username.length < USERNAME_MIN_LENGTH) return 'too-short';
  if (username.length > USERNAME_MAX_LENGTH) return 'too-long';
  if (!USERNAME_PATTERN.test(username)) return 'charset';
  if (isReservedUsername(username)) return 'reserved';
  return null;
}

/** Human-readable copy for each problem, used by both forms. */
export const USERNAME_PROBLEM_MESSAGE: Record<UsernameProblem, string> = {
  'too-short': `Username must be at least ${USERNAME_MIN_LENGTH} characters.`,
  'too-long': `Username must be ${USERNAME_MAX_LENGTH} characters or fewer.`,
  charset: 'Username can only use letters, numbers, dashes and underscores.',
  reserved: 'That username is reserved.',
};
