/**
 * Session written once by auth.setup.ts and reused by every authenticated
 * spec. Logging in per test blew past the 8-per-5-minutes limiter in
 * `loginAction`; one shared state keeps the suite under it and much faster.
 */
export const STORAGE_STATE = 'scripts/e2e/.auth/user.json';
