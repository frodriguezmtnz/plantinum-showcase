/**
 * PlayStation profile links are user-controlled content shown on a public
 * page, so they are restricted to known trophy/profile hosts instead of
 * accepting arbitrary URLs. The Settings form only asks for a nickname and the
 * URL is built here.
 */

const MAX_URL_LENGTH = 300;

export type PsnProvider =
  | 'psnprofiles'
  | 'playstation'
  | 'psntrophyleaders'
  | 'pocketpsn'
  | 'exophase'
  | 'truetrophies'
  | 'playstationtrophies';

interface PsnProviderConfig {
  value: PsnProvider;
  label: string;
  /** Local favicon committed under /public, so CSP keeps img-src 'self'. */
  icon: string;
  hosts: readonly string[];
  build: (handle: string) => string;
  extract: (url: URL) => string | null;
  profileLabel: (handle: string | null) => string;
}

/** PSN online IDs: 3–16 letters, numbers, dashes or underscores. */
export const PSN_HANDLE_PATTERN = /^[A-Za-z0-9_-]{3,16}$/;

export type PsnHandleProblem = 'empty' | 'invalid';

export function psnHandleProblem(handle: string): PsnHandleProblem | null {
  const value = handle.trim();
  if (!value) return 'empty';
  return PSN_HANDLE_PATTERN.test(value) ? null : 'invalid';
}

const encode = (handle: string) => encodeURIComponent(handle.trim());

function segmentAt(pathname: string, index: number): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const segment = parts[index];
  return segment ? decodeURIComponent(segment).trim() || null : null;
}

function genericLabel(name: string) {
  return (handle: string | null) =>
    handle ? `${name} profile ${handle}` : `${name} profile`;
}

const PSN_PROVIDER_CONFIGS: readonly PsnProviderConfig[] = [
  {
    value: 'psnprofiles',
    icon: '/psn-icons/psnprofiles.png',
    label: 'PSNProfiles',
    hosts: ['psnprofiles.com'],
    build: (handle) => `https://psnprofiles.com/${encode(handle)}`,
    extract: (url) => segmentAt(url.pathname, 0),
    profileLabel: genericLabel('PSNProfiles'),
  },
  {
    value: 'playstation',
    icon: '/psn-icons/playstation.png',
    label: 'PlayStation',
    hosts: ['playstation.com'],
    build: (handle) => `https://profile.playstation.com/${encode(handle)}`,
    extract: (url) => {
      const host = url.hostname.toLowerCase();
      if (host === 'profile.playstation.com') {
        return segmentAt(url.pathname, 0);
      }
      if (host === 'my.playstation.com') {
        return segmentAt(url.pathname, 1);
      }
      return null;
    },
    profileLabel: () => 'PlayStation profile',
  },
  {
    value: 'psntrophyleaders',
    icon: '/psn-icons/psntrophyleaders.png',
    label: 'PSNTrophyLeaders',
    hosts: ['psntrophyleaders.com'],
    build: (handle) =>
      `https://psntrophyleaders.com/user/view/${encode(handle)}`,
    extract: (url) => segmentAt(url.pathname, 2),
    profileLabel: genericLabel('PSNTrophyLeaders'),
  },
  {
    value: 'pocketpsn',
    icon: '/psn-icons/pocketpsn.png',
    label: 'PocketPSN',
    hosts: ['pocketpsn.com'],
    build: (handle) => `https://pocketpsn.com/${encode(handle)}`,
    extract: (url) => segmentAt(url.pathname, 0),
    profileLabel: genericLabel('PocketPSN'),
  },
  {
    value: 'exophase',
    icon: '/psn-icons/exophase.png',
    label: 'Exophase',
    hosts: ['exophase.com'],
    build: (handle) => `https://www.exophase.com/psn/user/${encode(handle)}/`,
    extract: (url) => segmentAt(url.pathname, 2),
    profileLabel: genericLabel('Exophase'),
  },
  {
    value: 'truetrophies',
    icon: '/psn-icons/truetrophies.png',
    label: 'TrueTrophies',
    hosts: ['truetrophies.com'],
    build: (handle) => `https://www.truetrophies.com/gamer/${encode(handle)}`,
    extract: (url) => {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] === 'gamer' ? segmentAt(url.pathname, 1) : null;
    },
    profileLabel: genericLabel('TrueTrophies'),
  },
  {
    value: 'playstationtrophies',
    icon: '/psn-icons/playstationtrophies.png',
    label: 'PlayStationTrophies.org',
    hosts: ['playstationtrophies.org'],
    build: (handle) =>
      `https://www.playstationtrophies.org/profiles/${encode(handle)}`,
    extract: (url) => {
      const parts = url.pathname.split('/').filter(Boolean);
      return parts[0] === 'profiles' ? segmentAt(url.pathname, 1) : null;
    },
    profileLabel: genericLabel('PlayStationTrophies.org'),
  },
];

export const PSN_PROVIDERS = PSN_PROVIDER_CONFIGS.map(
  ({ value, label, icon }) => ({ value, label, icon }),
);

function configFor(provider: PsnProvider): PsnProviderConfig {
  return (
    PSN_PROVIDER_CONFIGS.find((config) => config.value === provider) ??
    PSN_PROVIDER_CONFIGS[0]!
  );
}

function hostMatches(config: PsnProviderConfig, hostname: string): boolean {
  const host = hostname.toLowerCase();
  return config.hosts.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}

export function buildPsnProfileUrl(
  provider: PsnProvider,
  handle: string,
): string {
  return configFor(provider).build(handle);
}

export type PsnProfileParse =
  | { ok: true; url: string | null }
  | { ok: false; reason: 'invalid' | 'too-long' | 'host' | 'protocol' };

/**
 * Empty input clears the link. Anything else must be an https URL on one of
 * the known hosts, with no embedded credentials.
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
  if (!PSN_PROVIDER_CONFIGS.some((config) => hostMatches(config, url.hostname))) {
    return { ok: false, reason: 'host' };
  }

  return { ok: true, url: url.toString() };
}

export interface PsnProfileLabel {
  label: string;
  kind: PsnProvider;
  handle: string | null;
}

/**
 * Human label for the About tab and the data needed to prefill the Settings
 * form (provider + nickname).
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

  const config = PSN_PROVIDER_CONFIGS.find((candidate) =>
    hostMatches(candidate, parsed.hostname),
  );
  if (!config) return null;

  const handle = config.extract(parsed);
  return {
    label: config.profileLabel(handle),
    kind: config.value,
    handle,
  };
}

export const PSN_PROFILE_HELP =
  'Pick a provider and type the nickname; we build the profile link.';

export const PSN_PROFILE_ERROR: Record<
  Exclude<PsnProfileParse, { ok: true }>['reason'],
  string
> = {
  invalid: 'That does not look like a valid URL.',
  'too-long': 'That URL is too long.',
  host: 'Use a supported trophy profile host.',
  protocol: 'The link must start with https://',
};
