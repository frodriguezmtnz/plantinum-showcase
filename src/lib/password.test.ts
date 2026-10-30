import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  passwordPolicyError,
  passwordRuleResults,
} from '@/lib/password';

describe('password policy', () => {
  it('accepts a strong password', () => {
    expect(passwordPolicyError('DemoTrophy#2026!')).toBeNull();
    expect(passwordRuleResults('DemoTrophy#2026!')).toEqual({
      length: true,
      lower: true,
      upper: true,
      number: true,
      symbol: true,
    });
  });

  it('reports the first unmet rule', () => {
    expect(passwordPolicyError('short')).toContain(
      `between ${PASSWORD_MIN_LENGTH}`,
    );
    expect(passwordPolicyError('alllowercasepassword')).toContain('uppercase');
    expect(passwordPolicyError('ALLUPPERCASEPASSWORD')).toContain('lowercase');
    expect(passwordPolicyError('NoNumbersHereAtAll!')).toContain('number');
    expect(passwordPolicyError('NoSymbolsHereAtAll123')).toContain('symbol');
  });

  it('caps the maximum length', () => {
    expect(passwordPolicyError(`Aa1!${'x'.repeat(130)}`)).toContain('between');
  });
});
