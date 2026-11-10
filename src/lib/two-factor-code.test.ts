import { describe, expect, it } from 'vitest';
import {
  isRecoveryCodeEntry,
  isTotpCode,
  isTwoFactorCode,
} from '@/lib/two-factor-code';

describe('isTotpCode', () => {
  it('accepts exactly six digits, ignoring whitespace', () => {
    expect(isTotpCode('123456')).toBe(true);
    expect(isTotpCode(' 123 456 ')).toBe(true);
  });

  it('rejects incomplete, overlong or non-numeric values', () => {
    expect(isTotpCode('12345')).toBe(false);
    expect(isTotpCode('1234567')).toBe(false);
    expect(isTotpCode('12345a')).toBe(false);
    expect(isTotpCode('')).toBe(false);
  });
});

describe('isRecoveryCodeEntry', () => {
  it('accepts a full 20-character recovery code with dashes', () => {
    expect(isRecoveryCodeEntry('ABCD-EFGH-JKLM-NPQR-2345')).toBe(true);
  });

  it('normalizes case and separators', () => {
    expect(isRecoveryCodeEntry('abcd efgh jklm npqr 2345')).toBe(true);
  });

  it('rejects partial recovery codes', () => {
    expect(isRecoveryCodeEntry('ABCD-EFGH')).toBe(false);
    expect(isRecoveryCodeEntry('123456')).toBe(false);
  });
});

describe('isTwoFactorCode', () => {
  it('accepts either a TOTP or a recovery code', () => {
    expect(isTwoFactorCode('123456')).toBe(true);
    expect(isTwoFactorCode('ABCD-EFGH-JKLM-NPQR-2345')).toBe(true);
  });

  it('rejects values that are neither complete format', () => {
    expect(isTwoFactorCode('12345')).toBe(false);
    expect(isTwoFactorCode('1231231222222222222222222')).toBe(false);
  });
});
