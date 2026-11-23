import type { PrismParams } from "./prism-wall";

export interface PrismPreset {
  params: Partial<PrismParams>;
  aspectRatio: string;
  sizes: string;
  className: string;
  animateInitial: boolean;
  clipToViewport: boolean;
  autoplay: boolean;
  fov: number;
}

export const PRISM_PRESETS = {
  home: {
    params: {
      cellWidth: 34,
      cellHeight: 12,
      depth: 0.8,
      duration: 0.7,
      stagger: 0.25,
      flowScale: 0.45,
      flowSpeed: 0.55,
      evolve: 0.3,
      steer: 6,
      explode: 0.75,
      drift: -0.2,
      tether: 2,
      stretch: 0.2,
      gloss: 0.7,
    },
    aspectRatio: "16 / 9",
    sizes: "(min-width: 1024px) 1024px, 100vw",
    className: "mx-auto max-w-5xl",
    animateInitial: false,
    clipToViewport: true,
    autoplay: true,
    fov: 30,
  },
  explore: {
    params: {
      cellWidth: 40,
      cellHeight: 15,
      bricks: true,
      gap: 0.25,
      depth: 0.8,
      duration: 1.4,
      stagger: 0.85,
      flowScale: 1.25,
      flowSpeed: 1.15,
      evolve: 0.69,
      steer: 1.9,
      explode: 2.45,
      drift: -0.2,
      tether: 1.8,
      stretch: 0.2,
      shrink: 0.09,
      gloss: 0.7,
    },
    aspectRatio: "16 / 9",
    sizes: "(min-width: 1024px) 1024px, 100vw",
    className: "mx-auto max-w-5xl",
    animateInitial: true,
    clipToViewport: false,
    autoplay: true,
    fov: 32,
  },
} satisfies Record<"home" | "explore", PrismPreset>;
