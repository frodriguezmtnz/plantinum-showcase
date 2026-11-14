import { createHash } from "node:crypto";
import sharp from "sharp";
import { avatarImageKey, isStorageConfigured, putImage } from "@/lib/b2";
import { detectImageType } from "@/lib/image-signature";
import { triageImageHash } from "@/lib/ai-triage";

const AVATAR_EDGE = 256;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5_000;

// Google serves profile pictures from lh3.googleusercontent.com and other
// googleusercontent subdomains. Keep the host allowlist tight: the URL comes
// from the OAuth profile, but it is fetched server-side.
const GOOGLE_AVATAR_HOST = /(^|\.)googleusercontent\.com$/i;

function parseHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** True only for https URLs on a googleusercontent.com subdomain. */
export function isGoogleAvatarUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const url = parseHttpsUrl(value);
  return Boolean(url && GOOGLE_AVATAR_HOST.test(url.hostname));
}

/**
 * Google's default profile picture is 96px. Ask for the 256px rendition before
 * re-encoding, instead of upscaling a tiny thumbnail.
 */
export function googleAvatarHiResUrl(value: string): string {
  if (!isGoogleAvatarUrl(value)) return value;
  return value.replace(/=s\d+(-c)?$/i, "=s256-c");
}

async function fetchGoogleAvatar(url: string): Promise<Buffer | null> {
  if (!isGoogleAvatarUrl(url)) return null;

  let response: Response;
  try {
    response = await fetch(googleAvatarHiResUrl(url), {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg" },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;
  // `redirect: "follow"` could land somewhere else; never fetch from an
  // arbitrary host even if Google returned the redirect.
  if (response.url && !isGoogleAvatarUrl(response.url)) return null;

  const contentType = (response.headers.get("content-type") ?? "")
    .split(";")[0]
    ?.trim()
    .toLowerCase() ?? "";
  if (!contentType.startsWith("image/")) return null;

  const declaredLength = Number(response.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_AVATAR_BYTES) return null;

  let raw: Buffer;
  try {
    raw = Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }

  if (raw.length === 0 || raw.length > MAX_AVATAR_BYTES) return null;
  if (!detectImageType(raw)) return null;

  return raw;
}

/**
 * Downloads the Google profile picture, screens it with the same fail-open
 * policy as manual avatar uploads, stores it in B2 and returns the public
 * `/api/avatars/<userId>` URL. Any failure returns null so onboarding can fall
 * back to the generated avatar without blocking the account.
 */
export async function importGoogleAvatar({
  userId,
  url,
}: {
  userId: string;
  url: string | null | undefined;
}): Promise<string | null> {
  if (!url || !isStorageConfigured()) return null;

  const raw = await fetchGoogleAvatar(url);
  if (!raw) return null;

  let processed: Buffer;
  try {
    processed = await sharp(raw)
      .rotate()
      .resize({ width: AVATAR_EDGE, height: AVATAR_EDGE, fit: "cover" })
      .avif({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }

  try {
    const hash = createHash("sha256").update(processed).digest("hex");
    const triage = await triageImageHash({
      hash: `avatar:${hash}`,
      data: processed,
      mimeType: "image/avif",
      kind: "avatar",
    });
    // Same product decision as the manual avatar flow: UNSAFE is rejected,
    // REVIEW or a classifier outage is allowed.
    if (triage.verdict?.label === "UNSAFE") return null;
  } catch {
    // Fail-open: an outage must not block a Google sign-up.
  }

  try {
    await putImage(avatarImageKey(userId), processed);
  } catch {
    return null;
  }

  return `/api/avatars/${userId}?v=${Date.now()}`;
}
