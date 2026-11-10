import { generate } from 'otplib';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  buildTotpQrDataUrl,
  buildTotpUri,
  decryptTwoFactorSecret,
  encryptTwoFactorSecret,
  formatRecoveryCode,
  generateRecoveryCodes,
  generateTwoFactorSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  TOTP_ISSUER,
  TwoFactorConfigError,
  verifyTotpCode,
} from '@/lib/two-factor';

const previousKey = process.env.TOTP_ENCRYPTION_KEY;

beforeEach(() => {
  process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
});

afterAll(() => {
  if (previousKey === undefined) delete process.env.TOTP_ENCRYPTION_KEY;
  else process.env.TOTP_ENCRYPTION_KEY = previousKey;
});

describe('encryptTwoFactorSecret', () => {
  it('round-trips the secret without storing it in plaintext', () => {
    const secret = generateTwoFactorSecret();
    const encrypted = encryptTwoFactorSecret(secret);

    expect(encrypted).not.toContain(secret);
    expect(encrypted.startsWith('v1.')).toBe(true);
    expect(decryptTwoFactorSecret(encrypted)).toBe(secret);
  });

  it('rejects tampered ciphertext and a missing key', () => {
    const encrypted = encryptTwoFactorSecret(generateTwoFactorSecret());
    const parts = encrypted.split('.');
    const ciphertext = parts[3]!;
    parts[3] = `${ciphertext[0] === 'A' ? 'B' : 'A'}${ciphertext.slice(1)}`;
    expect(() => decryptTwoFactorSecret(parts.join('.'))).toThrow();

    delete process.env.TOTP_ENCRYPTION_KEY;
    expect(() => encryptTwoFactorSecret('secret')).toThrow(TwoFactorConfigError);
  });
});

describe('TOTP', () => {
  it('verifies a current code and rejects a wrong one', async () => {
    const secret = generateTwoFactorSecret();
    const token = await generate({ secret });

    expect(await verifyTotpCode(secret, token)).toBe(true);
    expect(await verifyTotpCode(secret, '000000')).toBe(false);
    expect(await verifyTotpCode(secret, 'not-a-code')).toBe(false);
  });

  it('builds the authenticator URI and QR data URL', async () => {
    const secret = generateTwoFactorSecret();
    const uri = buildTotpUri(secret, 'hunter@example.com');

    expect(uri).toContain('otpauth://totp/');
    expect(uri).toContain(encodeURIComponent(TOTP_ISSUER));
    expect(uri).toContain(secret);
    expect(await buildTotpQrDataUrl(uri)).toMatch(/^data:image\/png;base64,/);
  });
});

describe('recovery codes', () => {
  it('formats, normalizes and hashes consistently', () => {
    const raw = 'abcdefghijklmnopqrst';
    expect(formatRecoveryCode(raw)).toBe('ABCD-EFGH-IJKL-MNOP-QRST');
    expect(normalizeRecoveryCode('abcd-efgh ijkl mnop qrst')).toBe(
      'ABCDEFGHIJKLMNOPQRST',
    );
    expect(hashRecoveryCode('abcd-efgh-ijkl-mnop-qrst')).toBe(
      hashRecoveryCode('ABCDEFGHIJKLMNOPQRST'),
    );
  });

  it('generates ten unique, well-formed codes', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
    }
  });
});
