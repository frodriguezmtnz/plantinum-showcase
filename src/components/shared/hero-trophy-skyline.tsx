import Image from 'next/image';

/**
 * Ghosted trophy skyline behind the race row.
 *
 * Product principle: the screenshot is the hero, so the cups never compete —
 * they sit at ~9% multiply (a pale duotone on the paper field), anchored to
 * the row's baseline and dissolved upward by a mask. Decorative only.
 *
 * Swap the art without touching this file: drop the render at
 * design/source/trophies/hero-group.png and run `pnpm brand`.
 */
export function HeroTrophySkyline({ className }: { className?: string }) {
  return (
    <div className={className ? `hero-skyline ${className}` : 'hero-skyline'} aria-hidden>
      <Image
        src="/assets/brand/hero-trophies.webp"
        alt=""
        fill
        sizes="100vw"
        unoptimized
        fetchPriority="low"
        className="hero-skyline-art hm-skyline"
      />
    </div>
  );
}
