import type { ModerationStatus } from '@/lib/data';

/** Query flag the image route understands to return a pixelated variant. */
export const PIXELATE_QUERY_FLAG = 'pixel';

/** True while a plate is kept off the public lists (under review or hidden). */
export function isPlateUnderModeration(status: ModerationStatus): boolean {
  return status !== 'PUBLISHED';
}

/** Append the pixelation flag to an image URL the route can serve. */
export function withPixelFlag(imageUrl: string): string {
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}fx=${PIXELATE_QUERY_FLAG}`;
}

/**
 * Screenshots that are not public are requested with the pixelation flag. The
 * server is the one that decides: moderators still receive the untouched image
 * so they can judge it, everyone else gets the mosaic.
 */
export function displayImageUrl(
  imageUrl: string,
  status: ModerationStatus,
): string {
  if (!isPlateUnderModeration(status)) return imageUrl;
  return withPixelFlag(imageUrl);
}
