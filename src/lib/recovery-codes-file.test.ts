import { describe, expect, it } from 'vitest';
import {
  buildRecoveryCodesFile,
  recoveryCodesFileName,
} from '@/lib/recovery-codes-file';

const codes = Array.from(
  { length: 10 },
  (_, index) => `ABCD-EFGH-IJKL-MNOP-QR${index.toString().padStart(2, '0')}`,
);
const generatedAt = new Date('2026-11-10T12:34:56.000Z');

describe('buildRecoveryCodesFile', () => {
  it('includes the account, timestamp and every recovery code', () => {
    const file = buildRecoveryCodesFile({
      username: 'trophy_hunter',
      codes,
      generatedAt,
    });

    expect(file).toContain('Account: @trophy_hunter');
    expect(file).toContain('Generated: 2026-11-10T12:34:56.000Z');
    expect(file).toContain('You have 10 of 10 recovery codes.');
    for (const code of codes) {
      expect(file).toContain(code);
    }
  });

  it('warns that the codes are one-time and cannot be shown again', () => {
    const file = buildRecoveryCodesFile({
      username: 'trophy_hunter',
      codes,
      generatedAt,
    });

    expect(file).toContain('Each code works once.');
    expect(file).toContain('cannot be shown again');
  });

  it('names the file after the account and the generation date', () => {
    expect(
      recoveryCodesFileName({ username: 'Trophy_Hunter', generatedAt }),
    ).toBe(
      'platinum-showcase-recovery-codes-trophy_hunter-2026-11-10.txt',
    );
  });

  it('sanitizes unusual handles for a safe filename', () => {
    expect(
      recoveryCodesFileName({ username: ' Trophy Hunter! ', generatedAt }),
    ).toBe('platinum-showcase-recovery-codes-trophy-hunter-2026-11-10.txt');
    expect(recoveryCodesFileName({ username: '   ', generatedAt })).toBe(
      'platinum-showcase-recovery-codes-account-2026-11-10.txt',
    );
  });
});
