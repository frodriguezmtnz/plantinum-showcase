/**
 * In-process LRU cache for pixelated image variants.
 *
 * The mosaic for a given content hash never changes, so recomputing it
 * (sharp decode → downsample → upscale → AVIF encode) on every request is
 * pure waste: repeated views of the same plate are the common case. Bounded
 * to MAX_ENTRIES so memory stays predictable on serverless instances.
 */

const MAX_ENTRIES = 100;

const cache = new Map<string, Buffer>();

export function getCachedMosaic(hash: string): Buffer | undefined {
  const mosaic = cache.get(hash);
  if (mosaic === undefined) return undefined;

  // Refresh recency (Map iterates oldest-first).
  cache.delete(hash);
  cache.set(hash, mosaic);
  return mosaic;
}

export function setCachedMosaic(hash: string, mosaic: Buffer): void {
  if (cache.has(hash)) cache.delete(hash);
  cache.set(hash, mosaic);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
}

/** Test hook: the cache is module-global. */
export function clearMosaicCacheForTesting(): void {
  cache.clear();
}
