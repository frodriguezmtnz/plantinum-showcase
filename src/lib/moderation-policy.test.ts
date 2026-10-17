import { describe, expect, it } from 'vitest';
import {
  STRIKES_FOR_MANUAL_REVIEW,
  STRIKES_TO_BLOCK_UPLOADS,
  applyStrikePolicy,
  isUploadBlocked,
  strikesAfterHit,
  strikesAfterRestore,
} from '@/lib/moderation-policy';

describe('applyStrikePolicy', () => {
  it('lets a clean user publish on a SAFE verdict', () => {
    expect(applyStrikePolicy('PUBLISHED', 0)).toBe('PUBLISHED');
  });

  it('routes a flagged user to manual review even when the verdict is SAFE', () => {
    expect(applyStrikePolicy('PUBLISHED', STRIKES_FOR_MANUAL_REVIEW)).toBe(
      'UNDER_REVIEW',
    );
  });

  it('never downgrades a stricter outcome', () => {
    expect(applyStrikePolicy('UNDER_REVIEW', 5)).toBe('UNDER_REVIEW');
    expect(applyStrikePolicy('HIDDEN', 5)).toBe('HIDDEN');
  });
});

describe('strike ladder', () => {
  it('blocks uploads at the top of the ladder, not before', () => {
    expect(isUploadBlocked(STRIKES_TO_BLOCK_UPLOADS - 1)).toBe(false);
    expect(isUploadBlocked(STRIKES_TO_BLOCK_UPLOADS)).toBe(true);
  });

  it('adds one strike per confirmed hit', () => {
    expect(strikesAfterHit(0)).toBe(1);
    expect(strikesAfterHit(2)).toBe(3);
  });

  it('restores a strike on a publish but never below zero', () => {
    expect(strikesAfterRestore(3)).toBe(2);
    expect(strikesAfterRestore(0)).toBe(0);
  });
});
