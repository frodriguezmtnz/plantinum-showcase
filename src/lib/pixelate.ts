import sharp from 'sharp';

/** Long edge, in pixels, of the mosaic grid before it is blown back up. */
export const PIXELATE_EDGE = 42;

export interface PixelateOptions {
  /** Long edge of the downsampled grid. Smaller means chunkier blocks. */
  edge?: number;
  /** Container for the mosaic. AVIF in production; PNG makes tests lossless. */
  format?: 'avif' | 'png';
}

/**
 * Downsamples to a small grid and scales it back with nearest-neighbour so the
 * result is a hard mosaic.
 *
 * This runs on the server on purpose: hiding a raw screenshot behind a CSS
 * filter would still ship the real bytes to the client. Returns null when the
 * source has no readable dimensions.
 */
export async function pixelateBuffer(
  buffer: Buffer | Uint8Array,
  options: PixelateOptions = {},
): Promise<Buffer | null> {
  const { edge = PIXELATE_EDGE, format = 'avif' } = options;
  const input = Buffer.from(buffer);
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width === 0 || height === 0) return null;

  const scale = edge / Math.max(width, height);
  const gridWidth = Math.max(1, Math.round(width * scale));
  const gridHeight = Math.max(1, Math.round(height * scale));

  // Two separate pipelines on purpose: chaining both resizes in one pipeline
  // lets sharp pick its own kernel, which turns the mosaic back into a blur.
  const small = await sharp(input)
    .resize(gridWidth, gridHeight, { kernel: 'nearest', fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mosaic = sharp(small.data, {
    raw: {
      width: small.info.width,
      height: small.info.height,
      channels: small.info.channels,
    },
  }).resize(width, height, { kernel: 'nearest', fit: 'fill' });

  return format === 'png'
    ? mosaic.png().toBuffer()
    : mosaic.avif({ quality: 60, effort: 4 }).toBuffer();
}
