import { describe, expect, it } from 'vitest';
import { isReservedUsername, usernameProblem } from '@/lib/usernames';

describe('usernameProblem', () => {
  it('accepts letters, numbers, dashes and underscores', () => {
    expect(usernameProblem('trophy-hunter_1')).toBeNull();
  });

  it('flags length and charset problems', () => {
    expect(usernameProblem('ab')).toBe('too-short');
    expect(usernameProblem('a'.repeat(21))).toBe('too-long');
    expect(usernameProblem('space here')).toBe('charset');
    expect(usernameProblem('emoji🎮')).toBe('charset');
  });

  it('blocks reserved handles case-insensitively', () => {
    expect(usernameProblem('Admin')).toBe('reserved');
    expect(isReservedUsername('SHOWCASE')).toBe(true);
    expect(isReservedUsername('hunter')).toBe(false);
  });
});
