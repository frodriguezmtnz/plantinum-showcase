/**
 * Deterministic avatar art for accounts without an uploaded image: the handle's
 * initials over a seeded navy gradient with a faint trophy silhouette. No
 * photos and no storage — the same handle always renders the same tile.
 */

const MAX_SEED_LENGTH = 64;
const ART_VERSION = '1';

function sanitizeSeed(seed: string | null | undefined): string {
  const value = (seed ?? '').trim().slice(0, MAX_SEED_LENGTH);
  return value || 'player';
}

/** FNV-1a over code points: tiny, stable, and good enough to spread hues. */
function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (const char of seed) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function avatarHue(seed: string | null | undefined): number {
  // Keep tiles inside the brand's blue→magenta range instead of any hue.
  return 205 + (hashSeed(sanitizeSeed(seed)) % 100);
}

export function initialsFromSeed(seed: string | null | undefined): string {
  const value = sanitizeSeed(seed);
  const words = value.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const picked = words.length >= 2 ? [words[0], words[1]] : [words[0] ?? value];
  const initials = picked
    .map((word) => Array.from(word ?? '')[0] ?? '')
    .join('')
    .toUpperCase();

  return Array.from(initials).slice(0, 2).join('') || '?';
}

export function generatedAvatarUrl(seed: string | null | undefined): string {
  return `/api/generated-avatars/${encodeURIComponent(sanitizeSeed(seed))}?v=${ART_VERSION}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Standalone SVG (256×256). Colours stay inside the brand's navy range while
 * the hue shift keeps profiles visually distinct.
 */
export function generatedAvatarSvg(seed: string | null | undefined): string {
  const safeSeed = sanitizeSeed(seed);
  const hue = avatarHue(safeSeed);
  const initials = initialsFromSeed(safeSeed);
  const fontSize = initials.length > 1 ? 92 : 108;
  const label = escapeXml(`Avatar for ${safeSeed}`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 38% 24%)" />
      <stop offset="1" stop-color="hsl(${(hue + 20) % 360} 46% 12%)" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="url(#bg)" />
  <circle cx="128" cy="128" r="120" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2" />
  <g transform="translate(128 120) scale(1.02)" fill="#ffffff" fill-opacity="0.13" stroke="#ffffff" stroke-opacity="0.13" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-30 -34 H30 V-12 A30 30 0 0 1 -30 -12 Z" />
    <path d="M-30 -26 C-44 -26 -44 -6 -30 -6" fill="none" />
    <path d="M30 -26 C44 -26 44 -6 30 -6" fill="none" />
    <path d="M-8 16 H8 L6 34 H-6 Z" />
    <rect x="-22" y="34" width="44" height="10" rx="4" />
  </g>
  <text x="128" y="132" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="1" fill="#f8fafc">${escapeXml(initials)}</text>
</svg>`;
}
