/**
 * PlayStation profile links are user-controlled content shown on a public
 * page, so they are restricted to the two official/professional hosts instead
 * of accepting arbitrary URLs.
 */

const ALLOWED_PSN_HOSTS = ['psnprofiles.com', 'playstation.com'] as const;
const MAX_URL_LENGTH = 300;

export type PsnProfileParse =
  | { ok: true; url: string | null }
  | { ok: false; reason: 'invalid' | 'too-long' | 'host' | 'protocol' };

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_PSN_HOSTS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

/**
 * Empty input clears the link. Anything else must be an https URL on an
 * allowed host, with no embedded credentials.
 */
export function parsePsnProfileUrl(raw: string): PsnProfileParse {
  const value = raw.trim();
  if (!value) return { ok: true, url: null };
  if (value.length > MAX_URL_LENGTH) return { ok: false, reason: 'too-long' };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (url.protocol !== 'https:') return { ok: false, reason: 'protocol' };
  if (url.username || url.password) return { ok: false, reason: 'invalid' };
  if (!isAllowedHost(url.hostname)) return { ok: false, reason: 'host' };

  return { ok: true, url: url.toString() };
}

export interface PsnProfileLabel {
  label: string;
  kind: 'psnprofiles' | 'playstation';
}

/**
 * Human label for the About tab: PSNProfiles links carry the handle in the
 * first path segment, while playstation.com keeps a generic label.
 */
export function describePsnProfile(
  url: string | null | undefined,
): PsnProfileLabel | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'psnprofiles.com' || host.endsWith('.psnprofiles.com')) {
    const segment = parsed.pathname.split('/').filter(Boolean)[0];
    const handle = segment
      ? decodeURIComponent(segment).trim()
      : '';
    return {
      label: handle
        ? `PSNProfiles profile ${handle}`
        : 'PSNProfiles profile',
      kind: 'psnprofiles',
    };
  }

  if (host === 'playstation.com' || host.endsWith('.playstation.com')) {
    return { label: 'PlayStation profile', kind: 'playstation' };
  }

  return null;
}

export const PSN_PROFILE_HELP =
  'Only https links from psnprofiles.com or playstation.com are accepted.';

export const PSN_PROFILE_ERROR: Record<
  Exclude<PsnProfileParse, { ok: true }>['reason'],
  string
> = {
  invalid: 'That does not look like a valid URL.',
  'too-long': 'That URL is too long.',
  host: 'Use a psnprofiles.com or playstation.com link.',
  protocol: 'The link must start with https://',
};
