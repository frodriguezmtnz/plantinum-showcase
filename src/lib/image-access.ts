/**
 * Decides whether a stored screenshot can be served for a given image hash.
 *
 * A screenshot is content-addressed, so several plates can share the same
 * hash. The image stays public as long as at least one of them is PUBLISHED;
 * otherwise only its owner or a moderator may fetch it.
 */
export interface ImagePlate {
  userId: string;
  moderationStatus: string;
}

export interface ImageViewer {
  id?: string;
  isModerator?: boolean;
}

export function canServeStoredImage(
  plates: ImagePlate[],
  viewer: ImageViewer = {},
): boolean {
  if (plates.length === 0) return false;
  if (plates.some((plate) => plate.moderationStatus === 'PUBLISHED')) {
    return true;
  }
  if (!viewer.id) return false;
  if (viewer.isModerator) return true;
  return plates.some((plate) => plate.userId === viewer.id);
}
