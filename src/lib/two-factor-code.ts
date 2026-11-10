const TOTP_CODE_LENGTH = 6;
export const RECOVERY_CODE_LENGTH = 20;
export const RECOVERY_CODE_COUNT = 10;

/** A complete authenticator code: exactly six digits (whitespace ignored). */
export function isTotpCode(value: string): boolean {
  return new RegExp(`^\\d{${TOTP_CODE_LENGTH}}$`).test(value.replace(/\s/g, ''));
}

/** A complete recovery code: 20 alphanumeric chars once dashes/spaces are removed. */
export function isRecoveryCodeEntry(value: string): boolean {
  return (
    value.toUpperCase().replace(/[^A-Z0-9]/g, '').length === RECOVERY_CODE_LENGTH
  );
}

/** Either a 6-digit TOTP or a full recovery code. */
export function isTwoFactorCode(value: string): boolean {
  return isTotpCode(value) || isRecoveryCodeEntry(value);
}
