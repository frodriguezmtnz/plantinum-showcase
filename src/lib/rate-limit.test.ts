import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

const WINDOW = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('checkRateLimit', () => {
  it('allows requests up to the limit and blocks the next one', () => {
    expect(checkRateLimit('login-a', 3, WINDOW)).toEqual({ ok: true, retryAfterSeconds: 0 });
    expect(checkRateLimit('login-a', 3, WINDOW).ok).toBe(true);
    expect(checkRateLimit('login-a', 3, WINDOW).ok).toBe(true);
    expect(checkRateLimit('login-a', 3, WINDOW)).toEqual({ ok: false, retryAfterSeconds: 60 });
  });

  it('reports a retry window that shrinks with time', () => {
    checkRateLimit('login-b', 1, WINDOW);
    vi.advanceTimersByTime(30_000);
    expect(checkRateLimit('login-b', 1, WINDOW).retryAfterSeconds).toBe(30);
  });

  it('opens a fresh window once the old one expires', () => {
    checkRateLimit('login-c', 1, WINDOW);
    vi.advanceTimersByTime(WINDOW);
    expect(checkRateLimit('login-c', 1, WINDOW).ok).toBe(true);
  });

  it('keeps buckets independent per key', () => {
    checkRateLimit('login-d', 1, WINDOW);
    expect(checkRateLimit('other-d', 1, WINDOW).ok).toBe(true);
    expect(checkRateLimit('login-d', 1, WINDOW).ok).toBe(false);
  });

  it('rounds partial seconds up in retryAfterSeconds', () => {
    checkRateLimit('login-e', 1, 10_000);
    vi.advanceTimersByTime(9_500);
    expect(checkRateLimit('login-e', 1, 10_000).retryAfterSeconds).toBe(1);
  });
});
