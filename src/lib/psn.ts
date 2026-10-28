/**
 * PlayStation profile links are user-controlled content shown on a public
 * page, so they are restricted to the two official/professional hosts instead
 * of accepting arbitrary URLs. The Settings form only asks for a nickname and
 * the URL is built here.
 */

const ALLOWED_PSN_HOSTS = ['psnprofiles.com', 'playstation.com'] as const;
const MAX_URL_LENGTH = 300;

export type PsnProvider = 'psnprofiles' | 'playstation';

export const PSN_PROVIDERS: { value: PsnProvider; label: string }[] = [
  { value: 'psnprofiles', label: 'PSNProfiles' },
  { value: 'playstation', label: 'PlayStation' },
];

/** PSN online IDs: 3–16 letters, numbers, dashes or underscores. */
export const PSN_HANDLE_PATTERN = /^[A-Za-z0-9_-]{3,16}$/;

export type PsnHandleProblem = 'empty' | 'invalid';

export function psnHandleProblem(handle: string): PsnHandleProblem | null {
  const value = handle.trim();
  if (!value) return 'empty';
  return PSN_HANDLE_PATTERN.test(value) ? null : 'invalid';
}

export function buildPsnProfileUrl(
  provider: PsnProvider,
  handle: string,
): string {
  const encoded = encodeURIComponent(handle.trim());
  return provider === 'psnprofiles'
    ? `https://psnprofiles.com/${encoded}`
    : `https://profile.playstation.com/${encoded}`;
}

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
  kind: PsnProvider;
  handle: string | null;
}

function firstSegment(pathname: string): string | null {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment ? decodeURIComponent(segment).trim() || null : null;
}

/**
 * Human label for the About tab and the data needed to prefill the Settings
 * form: PSNProfiles keeps the handle in the first path segment, PlayStation in
 * `profile.playstation.com/<handle>` (legacy: `my.playstation.com/profile/<handle>`).
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
    const handle = firstSegment(parsed.pathname);
    return {
      label: handle ? `PSNProfiles profile ${handle}` : 'PSNProfiles profile',
      kind: 'psnprofiles',
      handle,
    };
  }

  if (host === 'playstation.com' || host.endsWith('.playstation.com')) {
    let handle: string | null = null;
    if (host === 'profile.playstation.com') {
      handle = firstSegment(parsed.pathname);
    } else if (host === 'my.playstation.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'profile' && parts[1]) {
        handle = decodeURIComponent(parts[1]).trim() || null;
      }
    }
    return { label: 'PlayStation profile', kind: 'playstation', handle };
  }

  return null;
}

export const PSN_PROFILE_HELP =
  'Pick a provider and type the nickname; we build the profile link. PSNProfiles and PlayStation only.';

export const PSN_PROFILE_ERROR: Record<
  Exclude<PsnProfileParse, { ok: true }>['reason'],
  string
> = {
  invalid: 'That does not look like a valid URL.',
  'too-long': 'That URL is too long.',
  host: 'Use a psnprofiles.com or playstation.com link.',
  protocol: 'The link must start with https://',
};
