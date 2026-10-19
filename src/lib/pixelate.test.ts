import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { PIXELATE_EDGE, pixelateBuffer } from '@/lib/pixelate';

async function gradient(width: number, height: number): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 3;
      pixels[i] = Math.round((x / width) * 255);
      pixels[i + 1] = Math.round((y / height) * 255);
      pixels[i + 2] = 128;
    }
  }
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

function countColours(
  data: Buffer,
  channels: number,
): Set<string> {
  const colours = new Set<string>();
  for (let i = 0; i < data.length; i += channels) {
    colours.add(`${data[i]}-${data[i + 1]}-${data[i + 2]}`);
  }
  return colours;
}

describe('pixelateBuffer', () => {
  it('keeps the original dimensions', async () => {
    const source = await gradient(320, 180);
    const result = await pixelateBuffer(source);
    expect(result).not.toBeNull();
    const meta = await sharp(result!).metadata();
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(180);
  });

  it('collapses the image into a small grid of flat blocks', async () => {
    const source = await gradient(320, 180);
    // PNG keeps the test lossless, so the block colours are exact.
    const result = (await pixelateBuffer(source, { edge: 8, format: 'png' }))!;
    const { data, info } = await sharp(result)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sourcePixels = await sharp(source)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixelatedColours = countColours(data, info.channels);
    const sourceColours = countColours(
      sourcePixels.data,
      sourcePixels.info.channels,
    );

    // An 8x5 grid can only ever show ~40 distinct block colours.
    expect(pixelatedColours.size).toBeLessThanOrEqual(40);
    expect(pixelatedColours.size).toBeLessThan(sourceColours.size / 10);
  });

  it('encodes AVIF by default', async () => {
    const source = await gradient(64, 64);
    const result = (await pixelateBuffer(source))!;
    const meta = await sharp(result).metadata();
    expect(meta.format).toBe('heif');
  });

  it('rejects a buffer that is not an image', async () => {
    await expect(pixelateBuffer(Buffer.from('not an image'))).rejects.toThrow();
  });

  it('exposes a sane default grid edge', () => {
    expect(PIXELATE_EDGE).toBeGreaterThan(0);
    expect(PIXELATE_EDGE).toBeLessThan(120);
  });
});
