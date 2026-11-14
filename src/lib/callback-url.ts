/**
 * Callback URLs travel through query strings and OAuth state. Only accept
 * same-site relative paths: never "//host", absolute URLs or protocol-relative
 * tricks.
 */
export function safeRelativeCallback(
  value: string | null | undefined,
  fallback = "/",
): string {
  const candidate = (value ?? "").trim();
  return candidate.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : fallback;
}
