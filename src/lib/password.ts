export const PASSWORD_MIN_LENGTH = 15;

// bcrypt silently truncates its input at 72 bytes, so bytes beyond that would
// give a false sense of extra entropy. The cap is in bytes (not characters)
// because a 128-char password with multibyte characters crosses it sooner.
export const PASSWORD_MAX_BYTES = 72;

// OWASP-recommended minimum cost for bcrypt (10 is cheap to brute-force
// offline on modern GPUs). Every hash call site must use this constant.
export const BCRYPT_COST = 12;

export type PasswordRuleId = 'length' | 'lower' | 'upper' | 'number' | 'symbol';

export const PASSWORD_RULES: { id: PasswordRuleId; label: string }[] = [
  { id: 'length', label: `At least ${PASSWORD_MIN_LENGTH} characters` },
  { id: 'lower', label: 'One lowercase letter' },
  { id: 'upper', label: 'One uppercase letter' },
  { id: 'number', label: 'One number' },
  { id: 'symbol', label: 'One symbol' },
];

export function passwordRuleResults(
  value: string,
): Record<PasswordRuleId, boolean> {
  return {
    length:
      value.length >= PASSWORD_MIN_LENGTH &&
      Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

const PASSWORD_RULE_MESSAGE: Record<PasswordRuleId, string> = {
  length: `Password must be between ${PASSWORD_MIN_LENGTH} characters and ${PASSWORD_MAX_BYTES} bytes.`,
  lower: 'Password must include a lowercase letter.',
  upper: 'Password must include an uppercase letter.',
  number: 'Password must include a number.',
  symbol: 'Password must include a symbol.',
};

/** First unmet rule, or null when the password is strong enough. */
export function passwordPolicyError(value: string): string | null {
  const results = passwordRuleResults(value);
  for (const rule of PASSWORD_RULES) {
    if (!results[rule.id]) return PASSWORD_RULE_MESSAGE[rule.id];
  }
  return null;
}
