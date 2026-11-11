#!/usr/bin/env node
/**
 * Demo plate art pipeline.
 *
 * The seed paints the gallery with 12 locally hosted screenshots. This script
 * turns the Unsplash sources listed in prisma/placeholder-images.json into AVIF
 * files under public/demo/plates, using the same encoder settings as real
 * uploads (1600px, quality 60). Keeping the art local means next/image never
 * needs a remote pattern and the CSP can stay at `img-src 'self'`.
 *
 *   pnpm demo:art           # only the missing files
 *   pnpm demo:art --force   # re-download and re-encode everything
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'prisma', 'placeholder-images.json');
const OUT_DIR = path.join(ROOT, 'public', 'demo', 'plates');
const WIDTH = 1600;
const HEIGHT = 900;

const force = process.argv.includes('--force');

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { placeholderImages } = JSON.parse(await readFile(MANIFEST, 'utf8'));

  await mkdir(OUT_DIR, { recursive: true });

  for (const entry of placeholderImages) {
    const target = path.join(OUT_DIR, path.basename(entry.imageUrl));

    if (!force && (await exists(target))) {
      console.log(`skip  ${path.relative(ROOT, target)} (use --force to rebuild)`);
      continue;
    }

    if (!entry.sourceUrl) {
      throw new Error(`Missing sourceUrl for ${entry.imageUrl}`);
    }

    const response = await fetch(entry.sourceUrl);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText} for ${entry.sourceUrl}`);
    }
    const source = Buffer.from(await response.arrayBuffer());

    const encoded = await sharp(source)
      .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'attention' })
      .avif({ quality: 60, effort: 4 })
      .toBuffer();

    await writeFile(target, encoded);
    const meta = await sharp(encoded).metadata();
    console.log(
      `build ${path.relative(ROOT, target)} (${meta.width}x${meta.height}, ` +
        `${(encoded.length / 1024).toFixed(0)} KB)`,
    );
  }
}

main().catch((error) => {
  console.error('[demo:art] failed:', error.message);
  process.exitCode = 1;
});
