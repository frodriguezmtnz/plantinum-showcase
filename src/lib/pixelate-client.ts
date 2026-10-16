/**
 * Client-side mosaic for the post-upload preview. Mirrors what the image route
 * does on the server (downscale, then nearest-neighbour upscale) so the owner
 * sees exactly what everyone else sees while the plate is under moderation.
 */
export async function pixelateImage(
  source: string,
  edge = 42,
): Promise<string | null> {
  const image = await loadImage(source);
  if (!image) return null;

  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (width === 0 || height === 0) return null;

  const scale = edge / Math.max(width, height);
  const gridWidth = Math.max(1, Math.round(width * scale));
  const gridHeight = Math.max(1, Math.round(height * scale));

  const small = document.createElement('canvas');
  small.width = gridWidth;
  small.height = gridHeight;
  const smallCtx = small.getContext('2d');
  if (!smallCtx) return null;
  smallCtx.drawImage(image, 0, 0, gridWidth, gridHeight);

  const big = document.createElement('canvas');
  big.width = width;
  big.height = height;
  const bigCtx = big.getContext('2d');
  if (!bigCtx) return null;
  bigCtx.imageSmoothingEnabled = false;
  bigCtx.drawImage(small, 0, 0, width, height);

  return big.toDataURL('image/jpeg', 0.72);
}

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}
