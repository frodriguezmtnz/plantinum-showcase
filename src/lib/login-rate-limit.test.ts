import { randomUUID } from 'crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  consumeLoginAttempt,
  LOGIN_WINDOW_MS,
  LoginRateLimitedError,
  MAX_ATTEMPTS_PER_EMAIL,
  MAX_ATTEMPTS_PER_IP,
} from '@/lib/login-rate-limit';

// next-auth's entry point imports next/server, which does not resolve under
// vitest. Only CredentialsSignin (a plain Error subclass) is needed here.
vi.mock('next-auth', () => {
  class CredentialsSignin extends Error {
    code?: string;
  }
  return { CredentialsSignin };
});

const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Force the per-process in-memory fallback so tests never touch a real
// Upstash instance, mirroring the rate-limit.test.ts setup.
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterAll(() => {
  if (previousUrl !== undefined) process.env.UPSTASH_REDIS_REST_URL = previousUrl;
  else delete process.env.UPSTASH_REDIS_REST_URL;
  if (previousToken !== undefined)
    process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  else delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

/** Fresh, collision-free identity for a single test. */
function freshIdentity(): { email: string; ip: string } {
  const id = randomUUID();
  return { email: `user-${id}@test.local`, ip: `10.0.${id.slice(0, 3)}.${id.slice(3, 5)}` };
}

describe('consumeLoginAttempt', () => {
  it('exposes the documented budget and window', () => {
    expect(MAX_ATTEMPTS_PER_EMAIL).toBe(8);
    expect(MAX_ATTEMPTS_PER_IP).toBe(20);
    expect(LOGIN_WINDOW_MS).toBe(5 * 60_000);
  });

  it('allows attempts until the per-email budget is exhausted, then throws', async () => {
    const { email, ip } = freshIdentity();

    for (let attempt = 1; attempt < MAX_ATTEMPTS_PER_EMAIL; attempt += 1) {
      await expect(consumeLoginAttempt(email, ip)).resolves.toBeUndefined();
    }
    // The 8th attempt is still within budget; the 9th is rejected.
    await expect(consumeLoginAttempt(email, ip)).resolves.toBeUndefined();
    await expect(consumeLoginAttempt(email, ip)).rejects.toThrow(
      LoginRateLimitedError,
    );
  });

  it('shares the per-ip budget across different emails', async () => {
    const ip = `192.168.${randomUUID().slice(0, 3)}.${randomUUID().slice(3, 5)}`;

    for (let attempt = 1; attempt < MAX_ATTEMPTS_PER_IP; attempt += 1) {
      await expect(
        consumeLoginAttempt(`ip-test-${attempt}@test.local`, ip),
      ).resolves.toBeUndefined();
    }
    // Distinct emails, same client: the 20th is still within the per-IP
    // budget, the 21st trips it.
    await expect(
      consumeLoginAttempt(`ip-final-${randomUUID()}@test.local`, ip),
    ).resolves.toBeUndefined();
    await expect(
      consumeLoginAttempt(`ip-extra-${randomUUID()}@test.local`, ip),
    ).rejects.toThrow(LoginRateLimitedError);
  });

  it('keeps independent budgets per email', async () => {
    const first = freshIdentity();
    const second = freshIdentity();

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_EMAIL; attempt += 1) {
      await consumeLoginAttempt(first.email, first.ip);
    }
    await expect(consumeLoginAttempt(first.email, first.ip)).rejects.toThrow(
      LoginRateLimitedError,
    );
    // Exhausting one account does not lock out a different one.
    await expect(
      consumeLoginAttempt(second.email, second.ip),
    ).resolves.toBeUndefined();
  });

  it('throws an error carrying the login_rate_limited code', async () => {
    const { email, ip } = freshIdentity();

    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_EMAIL; attempt += 1) {
      await consumeLoginAttempt(email, ip);
    }
    const error: unknown = await consumeLoginAttempt(email, ip).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(LoginRateLimitedError);
    expect((error as LoginRateLimitedError).code).toBe('login_rate_limited');
  });
});
