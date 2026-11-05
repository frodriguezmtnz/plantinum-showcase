import { describe, expect, it } from 'vitest';
import { isSessionVersionStale } from './session-revocation';

describe('session revocation', () => {
  it('keeps tokens that match the current version', () => {
    expect(isSessionVersionStale(0, 0)).toBe(false);
    expect(isSessionVersionStale(3, 3)).toBe(false);
  });

  it('rejects tokens minted before a version bump', () => {
    expect(isSessionVersionStale(2, 3)).toBe(true);
  });

  it('treats a missing version as 0', () => {
    expect(isSessionVersionStale(undefined, 0)).toBe(false);
    expect(isSessionVersionStale(null, 0)).toBe(false);
    expect(isSessionVersionStale(undefined, 1)).toBe(true);
  });
});
