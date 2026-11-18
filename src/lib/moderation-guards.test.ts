import { describe, expect, it } from 'vitest';
import {
  isModerationDecision,
  isPlatinumModerationOp,
} from '@/lib/moderation-core';

describe('moderation enum guards (fail-closed)', () => {
  it('accepts the real decisions', () => {
    for (const decision of ['dismiss', 'hide', 'delete'] as const) {
      expect(isModerationDecision(decision)).toBe(true);
    }
  });

  it('rejects unknown report decisions instead of falling through to delete', () => {
    expect(isModerationDecision('nuclear')).toBe(false);
    expect(isModerationDecision('')).toBe(false);
    expect(isModerationDecision(undefined)).toBe(false);
    expect(isModerationDecision({})).toBe(false);
    expect(isModerationDecision(null)).toBe(false);
  });

  it('accepts the real board ops', () => {
    for (const op of ['PUBLISHED', 'HIDDEN', 'DELETE'] as const) {
      expect(isPlatinumModerationOp(op)).toBe(true);
    }
  });

  it('rejects unknown board ops', () => {
    expect(isPlatinumModerationOp('publish')).toBe(false);
    expect(isPlatinumModerationOp('DELETE ')).toBe(false);
    expect(isPlatinumModerationOp(undefined)).toBe(false);
    expect(isPlatinumModerationOp(42)).toBe(false);
  });
});
