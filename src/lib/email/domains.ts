import { domainToASCII } from 'node:url';
import domains from './disposable-domains.json';

/**
 * Snapshot of https://github.com/disposable-email-domains/disposable-email-domains
 * (CC0). Regenerate with `pnpm update:disposable-domains`.
 *
 * The list stores registrable domains, so we check the address domain and every
 * parent suffix (`a.b.mailinator.com` -> `b.mailinator.com` -> `mailinator.com`).
 */
const BLOCKLIST = new Set(domains.map((domain) => domain.toLowerCase()));

const ALLOWLIST = new Set(
  (process.env.EMAIL_DOMAIN_ALLOWLIST ?? '')
    .split(',')
    .map((domain) => domain.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean),
);

export function isDisposableDomain(domain: string): boolean {
  const normalized = domain.trim().toLowerCase().replace(/\.+$/, '');
  if (!normalized) return false;

  const ascii = domainToASCII(normalized);
  if (!ascii) return false;

  const labels = ascii.split('.');
  // Stop before the bare TLD: "com" alone is never a registrable domain.
  for (let index = 0; index < labels.length - 1; index += 1) {
    const candidate = labels.slice(index).join('.');
    if (ALLOWLIST.has(candidate)) return false;
    if (BLOCKLIST.has(candidate)) return true;
  }
  return false;
}

export async function isDisposableEmail(email: string): Promise<boolean> {
  const at = email.lastIndexOf('@');
  if (at < 0) return false;
  return isDisposableDomain(email.slice(at + 1));
}
