import { RECOVERY_CODE_COUNT } from '@/lib/two-factor-code';

/** Builds a download name that identifies the account and the generation date. */
export function recoveryCodesFileName({
  username,
  generatedAt,
}: {
  username: string;
  generatedAt: Date;
}): string {
  const safeUsername =
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'account';
  const date = generatedAt.toISOString().slice(0, 10);
  return `platinum-showcase-recovery-codes-${safeUsername}-${date}.txt`;
}

/**
 * Builds the plain-text file offered right after recovery codes are generated.
 * The plaintext only exists at that moment; the database keeps SHA-256 hashes.
 */
export function buildRecoveryCodesFile({
  username,
  codes,
  generatedAt,
}: {
  username: string;
  codes: string[];
  generatedAt: Date;
}): string {
  return [
    'Platinum Showcase — two-factor recovery codes',
    `Account: @${username}`,
    `Generated: ${generatedAt.toISOString()}`,
    '',
    `You have ${codes.length} of ${RECOVERY_CODE_COUNT} recovery codes.`,
    'Each code works once. Store this file somewhere safe.',
    'We only keep hashes, so these codes cannot be shown again.',
    '',
    ...codes,
    '',
  ].join('\n');
}
