/**
 * Best-effort client address for per-IP rate limiting.
 *
 * This is the single place where the proxy trust model lives, so it is the
 * only place that has to be audited when the deployment topology changes.
 *
 * Trust model:
 * - Take the RIGHTMOST entry of x-forwarded-for. Trustworthy proxies append
 *   the genuine connecting address to the chain, so a caller that supplies
 *   "1.2.3.4" gets "1.2.3.4, <real-ip>" and the real address wins. Vercel
 *   goes further and overwrites the header with the connecting client, so a
 *   single-value chain is the genuine address either way.
 * - A proxy that forwards the caller-supplied header verbatim (instead of
 *   appending) still lets the caller rotate this value; if that is the
 *   deployment topology, per-IP buckets are only a soft backstop and the
 *   per-key limits (email, user, token) elsewhere are the real defense.
 * - Falls back to x-real-ip (set by the platform, e.g. Vercel) and finally to
 *   "local" for direct development access.
 */
export function getClientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  const rightmost = forwarded
    ?.split(",")
    .map((hop) => hop.trim())
    .pop();
  return rightmost || headerList.get("x-real-ip")?.trim() || "local";
}
