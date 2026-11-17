import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import QRCode from 'qrcode';
import { generateSecret, generateURI, verify } from 'otplib';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';
import { RECOVERY_CODE_COUNT } from '@/lib/two-factor-code';

export const TOTP_ISSUER = 'Platinum Showcase';
export const TOTP_DIGITS = 6;
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_TOLERANCE_SECONDS = 30;

const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const RECOVERY_GROUP_SIZE = 4;
const RECOVERY_GROUPS = 5;
const ENCRYPTION_VERSION = 'v1';
const ENCRYPTION_KEY_BYTES = 32;
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 5 * 60_000;

export class TwoFactorConfigError extends Error {
  constructor(message = 'TOTP_ENCRYPTION_KEY is missing or invalid.') {
    super(message);
    this.name = 'TwoFactorConfigError';
  }
}

export type TwoFactorLoginResult = 'ok' | 'invalid' | 'rate-limited';

function encryptionKey(): Buffer {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw) throw new TwoFactorConfigError();

  let key: Buffer;
  try {
    key = Buffer.from(raw, 'base64');
  } catch {
    throw new TwoFactorConfigError();
  }
  if (key.length !== ENCRYPTION_KEY_BYTES) {
    throw new TwoFactorConfigError();
  }
  return key;
}

/** Encrypts a Base32 TOTP secret as `v1.<iv>.<tag>.<ciphertext>` (base64url). */
export function encryptTwoFactorSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

export function decryptTwoFactorSecret(payload: string): string {
  const [version, ivPart, tagPart, ciphertextPart] = payload.split('.');
  if (
    version !== ENCRYPTION_VERSION ||
    !ivPart ||
    !tagPart ||
    !ciphertextPart
  ) {
    throw new TwoFactorConfigError('The stored two-factor secret is invalid.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function generateTwoFactorSecret(): string {
  return generateSecret();
}

export function buildTotpUri(secret: string, label: string): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label,
    secret,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    algorithm: 'sha1',
  });
}

export function buildTotpQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
    color: { dark: '#111111', light: '#ffffff' },
  });
}

/**
 * Verifies a TOTP code and returns the absolute time step it matched, or
 * null. Exposed so callers can persist the consumed step for replay
 * prevention (a code is one-shot: earlier or equal steps are rejected).
 */
export async function verifyTotpTimestep(
  secret: string,
  code: string,
): Promise<number | null> {
  const token = code.replace(/\s+/g, '');
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(token)) return null;

  const result = await verify({
    secret,
    token,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    epochTolerance: TOTP_TOLERANCE_SECONDS,
    algorithm: 'sha1',
  });
  if (!result.valid) return null;

  const currentTimestep = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  return currentTimestep + result.delta;
}

export async function verifyTotpCode(
  secret: string,
  code: string,
): Promise<boolean> {
  return (await verifyTotpTimestep(secret, code)) !== null;
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatRecoveryCode(code: string): string {
  const normalized = normalizeRecoveryCode(code);
  return (
    normalized
      .match(new RegExp(`.{1,${RECOVERY_GROUP_SIZE}}`, 'g'))
      ?.join('-') ?? normalized
  );
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256')
    .update(normalizeRecoveryCode(code))
    .digest('hex');
}

function randomRecoveryCode(): string {
  let code = '';
  for (let i = 0; i < RECOVERY_GROUP_SIZE * RECOVERY_GROUPS; i += 1) {
    const byte = randomBytes(1)[0]!;
    code += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
  }
  return formatRecoveryCode(code);
}

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, randomRecoveryCode);
}

/** Consumes a recovery code atomically; it can never be used twice. */
export async function consumeRecoveryCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const normalized = normalizeRecoveryCode(code);
  if (normalized.length !== RECOVERY_GROUP_SIZE * RECOVERY_GROUPS) {
    return false;
  }

  const result = await prisma.twoFactorRecoveryCode.updateMany({
    where: {
      userId,
      codeHash: hashRecoveryCode(normalized),
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });
  return result.count === 1;
}

/**
 * Verifies a TOTP or recovery code without rate limiting.
 *
 * TOTP codes are one-shot: the consumed time step is claimed atomically
 * (monotonic), so the same code — or one from an already-used step — cannot
 * be replayed within the acceptance window.
 */
export async function verifyTwoFactorCode(
  userId: string,
  encryptedSecret: string | null,
  code: string,
): Promise<boolean> {
  const normalized = normalizeRecoveryCode(code);

  if (new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(normalized)) {
    if (!encryptedSecret) return false;
    try {
      const timestep = await verifyTotpTimestep(
        decryptTwoFactorSecret(encryptedSecret),
        normalized,
      );
      if (timestep === null) return false;
      return await consumeTotpTimestep(userId, timestep);
    } catch {
      return false;
    }
  }

  return consumeRecoveryCode(userId, normalized);
}

/**
 * Claims a TOTP time step atomically: only strictly newer steps than any
 * previously consumed one are accepted. Two concurrent verifications of the
 * same code can therefore never both succeed.
 */
export async function consumeTotpTimestep(
  userId: string,
  timestep: number,
): Promise<boolean> {
  const claimed = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { lastUsedTotpTimestep: null },
        { lastUsedTotpTimestep: { lt: timestep } },
      ],
    },
    data: { lastUsedTotpTimestep: timestep },
  });
  return claimed.count === 1;
}

/**
 * Verifies the second factor for a login. TOTP and recovery codes share a
 * five-attempts-per-five-minutes budget per account, including direct calls to
 * the Auth.js credentials endpoint.
 */
export async function verifyTwoFactorLogin(
  userId: string,
  encryptedSecret: string | null,
  code: string,
): Promise<TwoFactorLoginResult> {
  const limit = await checkRateLimit(
    `two-factor-login:${userId}`,
    LOGIN_ATTEMPT_LIMIT,
    LOGIN_ATTEMPT_WINDOW_MS,
  );
  if (!limit.ok) return 'rate-limited';

  return (await verifyTwoFactorCode(userId, encryptedSecret, code))
    ? 'ok'
    : 'invalid';
}
