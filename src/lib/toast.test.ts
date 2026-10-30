import { describe, expect, it } from 'vitest';
import {
  findDuplicateToast,
  TOAST_DEDUPE_WINDOW_MS,
  toastSignature,
} from '@/lib/toast';

const NOW = 1_000_000;

function toast(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a',
    title: 'Link copied',
    description: 'https://example.test/u/me',
    variant: 'success',
    open: true,
    createdAt: NOW - 100,
    ...overrides,
  };
}

describe('toastSignature', () => {
  it('combines variant, title and description', () => {
    expect(toastSignature(toast())).toBe(
      'success|Link copied|https://example.test/u/me',
    );
  });

  it('returns null when nothing textual can be compared', () => {
    expect(toastSignature({ title: null, description: null })).toBeNull();
    expect(toastSignature({})).toBeNull();
  });

  it('ignores non-string (JSX) titles', () => {
    expect(toastSignature({ title: { type: 'div' } })).toBeNull();
  });
});

describe('findDuplicateToast', () => {
  it('matches an identical toast inside the window', () => {
    const match = findDuplicateToast([toast()], toast(), NOW);
    expect(match?.id).toBe('a');
  });

  it('does not match once the window has passed', () => {
    const old = toast({ createdAt: NOW - TOAST_DEDUPE_WINDOW_MS - 1 });
    expect(findDuplicateToast([old], toast(), NOW)).toBeUndefined();
  });

  it('ignores toasts that are already closing', () => {
    const closing = toast({ open: false });
    expect(findDuplicateToast([closing], toast(), NOW)).toBeUndefined();
  });

  it('respects variant and text changes', () => {
    expect(
      findDuplicateToast([toast({ variant: 'danger' })], toast(), NOW),
    ).toBeUndefined();
    expect(
      findDuplicateToast([toast({ title: 'Profile saved' })], toast(), NOW),
    ).toBeUndefined();
  });
});
