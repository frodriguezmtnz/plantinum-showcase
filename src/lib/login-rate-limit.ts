/**
 * Brute-force barrier for credential sign-in.
 *
 * The budget is consumed inside the credentials provider's authorize() so
 * every password attempt is counted, including direct calls to the Auth.js
 * endpoint (POST /api/auth/callback/credentials) that never go through the
 * login Server Action. Both buckets are shared by the action and the endpoint:
 * the action no longer keeps its own copy.
 */

import { CredentialsSignin } from "next-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const MAX_ATTEMPTS_PER_EMAIL = 8;
export const MAX_ATTEMPTS_PER_IP = 20;
export const LOGIN_WINDOW_MS = 5 * 60_000;

export class LoginRateLimitedError extends CredentialsSignin {
  code = "login_rate_limited";
}

/**
 * Consumes one attempt from the per-account and per-client buckets and throws
 * LoginRateLimitedError when either budget is exhausted. Call this before the
 * user lookup so non-existent emails also consume the budget (no limit-based
 * account enumeration).
 */
export async function consumeLoginAttempt(
  email: string,
  ip: string,
): Promise<void> {
  const perEmail = await checkRateLimit(
    `login:${email}`,
    MAX_ATTEMPTS_PER_EMAIL,
    LOGIN_WINDOW_MS,
  );
  const perIp = await checkRateLimit(
    `login-ip:${ip}`,
    MAX_ATTEMPTS_PER_IP,
    LOGIN_WINDOW_MS,
  );
  if (!perEmail.ok || !perIp.ok) throw new LoginRateLimitedError();
}
