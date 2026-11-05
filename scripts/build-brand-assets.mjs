#!/usr/bin/env node
/**
 * Brand art pipeline.
 *
 * Drop the studio render at design/source/trophies/hero-group.(png|jpg|webp)
 * and run `pnpm brand`. While that file is missing the script falls back to
 * the committed placeholder SVG, so the hero always has an asset and swapping
 * in the real art never touches component code.
 */
import { access, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'design', 'source', 'trophies');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'brand');
const TARGET_WIDTH = 2000;

const REAL_CANDIDATES = ['hero-group.png', 'hero-group.jpg', 'hero-group.jpeg', 'hero-group.webp'];

async function findRealSource() {
  for (const name of REAL_CANDIDATES) {
    const file = path.join(SOURCE_DIR, name);
    try {
      await access(file);
      return file;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

async function main() {
  const real = await findRealSource();
  const source = real ?? path.join(SOURCE_DIR, 'placeholder-skyline.svg');

  await access(source);
  await mkdir(OUT_DIR, { recursive: true });

  const isVector = source.endsWith('.svg');
  let pipeline = sharp(source, isVector ? { density: 144 } : {});

  // A studio render usually ships with empty sky and floor; trimming the
  // uniform border makes the cups fill the layer instead of floating in it.
  if (!isVector) {
    try {
      pipeline = sharp(await pipeline.trim({ threshold: 10 }).toBuffer());
    } catch {
      // No uniform border: keep the frame as delivered.
    }
  }

  pipeline = pipeline.resize({
    width: TARGET_WIDTH,
    withoutEnlargement: !isVector,
    fit: 'inside',
  });

  const out = path.join(OUT_DIR, 'hero-trophies.webp');
  const info = await pipeline.webp({ quality: 82, effort: 5 }).toFile(out);
  const bytes = (await stat(out)).size;

  console.log(
    `${real ? 'render' : 'placeholder'} -> ${path.relative(ROOT, out)} ` +
      `(${info.width}x${info.height}, ${(bytes / 1024).toFixed(0)} KB)`,
  );
}

main().catch((error) => {
  console.error('[brand] failed:', error);
  process.exitCode = 1;
});
