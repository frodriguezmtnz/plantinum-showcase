export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

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
      value.length <= PASSWORD_MAX_LENGTH,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /\d/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
}

const PASSWORD_RULE_MESSAGE: Record<PasswordRuleId, string> = {
  length: `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
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
