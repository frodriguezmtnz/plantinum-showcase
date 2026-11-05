/**
 * A JWT is stale when it was issued before the account bumped its session
 * version (password change or reset). Missing versions compare as 0 so tokens
 * minted before this field existed stay valid until the next bump.
 */
export function isSessionVersionStale(
  tokenVersion: number | null | undefined,
  currentVersion: number,
): boolean {
  return (tokenVersion ?? 0) !== currentVersion;
}
