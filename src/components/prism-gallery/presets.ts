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
      cellWidth: 25,
      cellHeight: 8,
      bricks: true,
      gap: 0.2,
      depth: 1.5,
      duration: 1.5,
      stagger: 1.0,
      flowScale: 0.69,
      flowSpeed: 1.04,
      evolve: 0.52,
      steer: 4.14,
      explode: 1.83,
      drift: -0.61,
      tether: 1.17,
      stretch: 0.49,
      shrink: 0,
      gloss: 1,
    },
    aspectRatio: "21 / 9",
    sizes: "(min-width: 1400px) 1400px, 100vw",
    className: "mx-auto w-full",
    animateInitial: true,
    clipToViewport: true,
    autoplay: true,
    fov: 30,
  },
} satisfies Record<"home" | "explore", PrismPreset>;
