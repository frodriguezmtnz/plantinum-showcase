import {
  buildPsnProfileUrl,
  describePsnProfile,
  parsePsnProfileUrl,
  psnHandleProblem,
  PSN_PROVIDERS,
  type PsnProvider,
} from '@/lib/psn';

export interface ProfileLinkView {
  provider: PsnProvider;
  handle: string;
  url: string;
  label: string;
}

export interface ProfileLinkInput {
  provider: PsnProvider;
  handle: string;
  url: string;
}

export type ProfileLinksParse =
  | { ok: true; links: ProfileLinkInput[] }
  | { ok: false; error: string };

const PROVIDER_VALUES = new Set<string>(PSN_PROVIDERS.map((p) => p.value));

function isProvider(value: unknown): value is PsnProvider {
  return typeof value === 'string' && PROVIDER_VALUES.has(value);
}

/**
 * The Settings form posts `links` as JSON. The server never trusts URLs from
 * the client: it validates provider + nickname and rebuilds the URL here.
 */
export function parseProfileLinks(raw: string | null | undefined): ProfileLinksParse {
  if (!raw || !raw.trim()) return { ok: true, links: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'The profile links are not valid.' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'The profile links are not valid.' };
  }
  if (parsed.length > PSN_PROVIDERS.length) {
    return {
      ok: false,
      error: `You can add up to ${PSN_PROVIDERS.length} profile links.`,
    };
  }

  const links: ProfileLinkInput[] = [];
  const seen = new Set<string>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: 'The profile links are not valid.' };
    }
    const { provider, handle } = entry as {
      provider?: unknown;
      handle?: unknown;
    };
    if (!isProvider(provider)) {
      return { ok: false, error: 'That profile provider is not supported.' };
    }
    if (typeof handle !== 'string') {
      return { ok: false, error: 'Each profile needs a nickname.' };
    }

    const trimmed = handle.trim();
    if (psnHandleProblem(trimmed) === 'invalid') {
      return {
        ok: false,
        error:
          'PSN nicknames are 3–16 characters: letters, numbers, dashes or underscores.',
      };
    }
    if (!trimmed) {
      return { ok: false, error: 'Each profile needs a nickname.' };
    }
    if (seen.has(provider)) {
      return {
        ok: false,
        error: 'You can only add one link per provider.',
      };
    }
    seen.add(provider);

    const url = buildPsnProfileUrl(provider, trimmed);
    const guard = parsePsnProfileUrl(url);
    if (!guard.ok || !guard.url) {
      return { ok: false, error: 'That profile link could not be built.' };
    }

    links.push({ provider, handle: trimmed, url: guard.url });
  }

  return { ok: true, links };
}

/** Maps a stored row to the view used by the About tab. */
export function toProfileLinkView(row: {
  provider: string;
  handle: string;
  url: string;
}): ProfileLinkView | null {
  if (!isProvider(row.provider)) return null;
  const described = describePsnProfile(row.url);
  return {
    provider: row.provider,
    handle: row.handle,
    url: row.url,
    label:
      described?.label ??
      `${PSN_PROVIDERS.find((p) => p.value === row.provider)?.label ?? 'Profile'} ${row.handle}`,
  };
}

/**
 * Users who predate the ProfileLink table still have a single psnProfileUrl.
 * The public profile and Settings synthesize a link from it until they save.
 */
export function legacyProfileLink(
  psnProfileUrl: string | null | undefined,
): ProfileLinkView | null {
  if (!psnProfileUrl) return null;
  const described = describePsnProfile(psnProfileUrl);
  if (!described || !described.handle) return null;
  return toProfileLinkView({
    provider: described.kind,
    handle: described.handle,
    url: psnProfileUrl,
  });
}
