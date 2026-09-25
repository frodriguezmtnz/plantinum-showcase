'use client';

import { useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * One authored motion moment for the home: a console "boot" on load (title
 * mask reveal + plates flying up in a staggered pop) and gentle, once-only
 * scroll reveals for the panels below the fold. No perpetual motion — the
 * ambient field is intentionally near-still. Everything is skipped under
 * prefers-reduced-motion, and entrance tweens clearProps so the CSS Bloom
 * hover keeps working.
 */
export function HomeMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (typeof window === 'undefined') return;
      // Headless captures freeze performance.now(), so GSAP tweens never
      // advance and the from-states would render as hidden content.
      // ?motion=off skips the intro for automated review.
      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        new URLSearchParams(window.location.search).get('motion') === 'off'
      ) {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const boot = gsap.timeline({ defaults: { ease: 'power3.out' } });
        boot
          .from('.hm-strip', { y: -18, autoAlpha: 0, duration: 0.55 })
          .from('.hm-title', { yPercent: 115, duration: 0.9 }, '-=0.15')
          .from('.hm-sub', { y: 14, autoAlpha: 0, duration: 0.6 }, '-=0.55')
          .from(
            '.hm-row .plate-shell',
            {
              y: 90,
              autoAlpha: 0,
              scale: 0.9,
              duration: 0.7,
              stagger: 0.07,
              ease: 'back.out(1.3)',
              clearProps: 'transform,opacity,visibility',
            },
            '-=0.35',
          )
          .from('.hm-hint', { autoAlpha: 0, duration: 0.6 }, '-=0.2');

        gsap.utils.toArray<HTMLElement>('.hm-reveal').forEach((el) => {
          gsap.from(el, {
            y: 42,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'power2.out',
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        });

        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad);
        return () => window.removeEventListener('load', onLoad);
      });

      return () => mm.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
