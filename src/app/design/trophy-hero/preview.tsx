'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';

type Variant = 'off' | 'skyline' | 'strong' | 'vitrine';

const VARIANTS: { id: Variant; label: string }[] = [
  { id: 'off', label: 'Sin capa' },
  { id: 'skyline', label: 'Skyline 9%' },
  { id: 'strong', label: 'Skyline 14%' },
  { id: 'vitrine', label: 'Vitrina' },
];

const FAKE_PLATES = [
  'from-[hsl(212_38%_30%)] to-[hsl(322_100%_30%)]',
  'from-[hsl(147_100%_24%)] to-[hsl(212_38%_24%)]',
  'from-[hsl(38_88%_42%)] to-[hsl(24_55%_36%)]',
  'from-[hsl(248_36%_38%)] to-[hsl(322_100%_40%)]',
  'from-[hsl(203_72%_44%)] to-[hsl(212_38%_22%)]',
];

function FakeRow() {
  return (
    <div className="flex w-full gap-5 overflow-hidden px-8 sm:px-24">
      {FAKE_PLATES.map((tone, i) => (
        <div
          key={i}
          className={`relative aspect-video w-64 shrink-0 rounded-xl bg-gradient-to-br ${tone} ring-1 ring-white/70 shadow-lift sm:w-72`}
        >
          <span className="photo-chip tabular absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
            #&nbsp;{i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HeroTrophyPreview() {
  const [variant, setVariant] = useState<Variant>('skyline');

  return (
    <div className="pb-24">
      <div className="fixed right-4 top-20 z-50 flex flex-wrap justify-end gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-lift backdrop-blur">
        {VARIANTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setVariant(item.id)}
            aria-pressed={variant === item.id}
            className={
              variant === item.id
                ? 'rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground'
                : 'rounded-lg px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted'
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 pb-10 pt-24">
        <div className="relative z-10 px-6 text-center">
          <p className="field-mark">Vista previa · /design/trophy-hero</p>
          <h1 className="font-headline mt-3 text-4xl font-light leading-[1.08] tracking-tight text-balance text-foreground md:text-6xl">
            Show your platinum to the world.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-secondary-foreground/80 md:text-lg">
            The community gallery for PlayStation platinums. Post the screenshot of a
            hard-won platinum and let trophy hunters vote it up.
          </p>
        </div>

        {variant === 'vitrine' ? (
          <div className="relative z-10 w-full max-w-3xl px-6">
            <figure className="overflow-hidden rounded-2xl border border-[hsl(212_25%_26%_/_0.55)] bg-[hsl(212_38%_10%)] shadow-[0_30px_70px_-35px_hsl(322_100%_44%_/_0.5)]">
              <div className="relative aspect-[8/3]">
                <Image
                  src="/assets/brand/hero-trophies.webp"
                  alt="Trophy art placeholder"
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  unoptimized
                  className="object-contain p-8"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[hsl(211_22%_70%)]">
                <span>Hall of Fame</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 tracking-normal normal-case">
                  imagen temporal
                </span>
              </figcaption>
            </figure>
          </div>
        ) : (
          <div className="relative z-10 w-full">
            {variant !== 'off' && (
              <div
                className="hero-skyline"
                aria-hidden
                style={
                  (variant === 'strong'
                    ? { '--skyline-opacity': 0.14 }
                    : {}) as CSSProperties
                }
              >
                <Image
                  src="/assets/brand/hero-trophies.webp"
                  alt=""
                  fill
                  sizes="100vw"
                  unoptimized
                  className="hero-skyline-art"
                />
              </div>
            )}
            <FakeRow />
          </div>
        )}

        <p className="field-mark relative z-10 hidden sm:block">
          Arrows or scroll to browse · Enter opens the plate
        </p>
      </section>
    </div>
  );
}
