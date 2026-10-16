import type { ModerationStatus } from '@/lib/data';

/**
 * Escalation ladder for repeat offenders. Both knobs are env-tunable so the
 * operator can loosen or tighten them without a deploy.
 *
 * - From `STRIKES_FOR_MANUAL_REVIEW` the user's uploads stop auto-publishing:
 *   even a SAFE verdict waits for a human.
 * - From `STRIKES_TO_BLOCK_UPLOADS` the upload action refuses outright.
 */
export const STRIKES_FOR_MANUAL_REVIEW = 2;
export const STRIKES_TO_BLOCK_UPLOADS = 3;

export function isUploadBlocked(strikes: number): boolean {
  return strikes >= STRIKES_TO_BLOCK_UPLOADS;
}

/** A confirmed hit (auto-hide or moderator take-down) adds exactly one strike. */
export function strikesAfterHit(current: number): number {
  return current + 1;
}

/** Restoring a plate is the escape valve: one strike comes back off, never below 0. */
export function strikesAfterRestore(current: number): number {
  return Math.max(0, current - 1);
}

/**
 * Applies the escalation ladder to a screening outcome: a user on the ladder
 * never gets an automatic publish, regardless of how confident the AI is.
 */
export function applyStrikePolicy(
  status: ModerationStatus,
  strikes: number,
): ModerationStatus {
  if (status === 'PUBLISHED' && strikes >= STRIKES_FOR_MANUAL_REVIEW) {
    return 'UNDER_REVIEW';
  }
  return status;
}
