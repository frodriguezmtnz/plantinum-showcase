import { RECOVERY_CODE_COUNT } from '@/lib/two-factor-code';

export const RECOVERY_CODE_FILE_NAME =
  'platinum-showcase-recovery-codes.txt';

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
