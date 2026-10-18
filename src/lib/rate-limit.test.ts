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

describe('checkRateLimit (in-memory fallback)', () => {
  it('allows requests up to the limit and blocks the next one', async () => {
    expect(await checkRateLimit('login-a', 3, WINDOW)).toEqual({ ok: true, retryAfterSeconds: 0 });
    expect((await checkRateLimit('login-a', 3, WINDOW)).ok).toBe(true);
    expect((await checkRateLimit('login-a', 3, WINDOW)).ok).toBe(true);
    expect(await checkRateLimit('login-a', 3, WINDOW)).toEqual({ ok: false, retryAfterSeconds: 60 });
  });

  it('reports a retry window that shrinks with time', async () => {
    await checkRateLimit('login-b', 1, WINDOW);
    vi.advanceTimersByTime(30_000);
    expect((await checkRateLimit('login-b', 1, WINDOW)).retryAfterSeconds).toBe(30);
  });

  it('opens a fresh window once the old one expires', async () => {
    await checkRateLimit('login-c', 1, WINDOW);
    vi.advanceTimersByTime(WINDOW);
    expect((await checkRateLimit('login-c', 1, WINDOW)).ok).toBe(true);
  });

  it('keeps buckets independent per key', async () => {
    await checkRateLimit('login-d', 1, WINDOW);
    expect((await checkRateLimit('other-d', 1, WINDOW)).ok).toBe(true);
    expect((await checkRateLimit('login-d', 1, WINDOW)).ok).toBe(false);
  });

  it('rounds partial seconds up in retryAfterSeconds', async () => {
    await checkRateLimit('login-e', 1, 10_000);
    vi.advanceTimersByTime(9_500);
    expect((await checkRateLimit('login-e', 1, 10_000)).retryAfterSeconds).toBe(1);
  });
});

describe('checkRateLimit with Upstash configured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('uses the shared Redis counter', async () => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io/');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: [1, 60_000] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { checkRateLimit: check } = await import('@/lib/rate-limit');
    expect(await check('redis-a', 3, 60_000)).toEqual({ ok: true, retryAfterSeconds: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.upstash.io');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-token' });
    const command = JSON.parse(String(init.body)) as string[];
    expect(command[0]).toBe('EVAL');
    expect(command[3]).toBe('ratelimit:redis-a');
  });

  it('reports the Redis TTL when blocked', async () => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ result: [4, 12_500] }) }),
    );

    const { checkRateLimit: check } = await import('@/lib/rate-limit');
    expect(await check('redis-b', 3, 60_000)).toEqual({ ok: false, retryAfterSeconds: 13 });
  });

  it('falls back to memory when Upstash fails', async () => {
    vi.resetModules();
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { checkRateLimit: check } = await import('@/lib/rate-limit');
    expect((await check('redis-c', 1, 60_000)).ok).toBe(true);
    expect((await check('redis-c', 1, 60_000)).ok).toBe(false);
    expect(consoleError).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
