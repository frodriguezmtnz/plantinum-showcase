/**
 * Theme hand-off between the day world and the Night Console.
 *
 * next-themes does the swap; this module only choreographs it with the View
 * Transitions API: the new theme grows out of the button that was pressed as a
 * soft-edged circle, so the change reads as a light being switched instead of a
 * repaint. The old world is a snapshot underneath, revealed theme on top.
 *
 * Origin, edge and feather all travel as percentages on purpose: Chrome paints
 * absolute lengths on `::view-transition-new(root)` unscaled at fractional
 * display scales (Windows 125/150%), which would drop the circle somewhere else.
 */

export type RevealOrigin = { x: string; y: string };

export type Rect = Pick<DOMRect, 'top' | 'left' | 'width' | 'height'>;
export type Size = { width: number; height: number };

/** Matches the action beat used by the vote burst and the header tuck. */
export const DEFAULT_REVEAL_MS = 560;

/** Shared with globals.css: the attribute that scopes every ::view-transition rule. */
export const THEME_TRANSITION_ATTR = 'data-theme-vt';

const MIN_PERCENT = 0;
const MAX_PERCENT = 100;

function pct(value: number): number {
  const clamped = Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
  return Math.round(clamped * 100) / 100;
}

/**
 * Centre of `rect` as percentages of the viewport. Falls back to the top-right
 * corner (where the header toggle lives) when the element has no box yet.
 */
export function circleOrigin(rect: Rect, viewport: Size): RevealOrigin {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { x: `${MAX_PERCENT}%`, y: `${MIN_PERCENT}%` };
  }

  const x = ((rect.left + rect.width / 2) / viewport.width) * 100;
  const y = ((rect.top + rect.height / 2) / viewport.height) * 100;

  return { x: `${pct(x)}%`, y: `${pct(y)}%` };
}

/**
 * A reveal is only worth starting when the browser can paint one and the
 * visitor wants motion. `?motion=off` is the house switch for automated
 * captures, which must never land mid-transition.
 */
export function shouldRevealThemeChange(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof document.startViewTransition !== 'function') {
    return false;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  return new URLSearchParams(window.location.search).get('motion') !== 'off';
}

let transitioning = false;

/**
 * Runs `apply` inside a view transition that expands from `origin`, or directly
 * when the effect is unavailable or unwanted. `apply` must flip the DOM
 * synchronously (next-themes applies its class from an effect, too late for the
 * snapshot) and may also update React state.
 */
export function revealThemeChange(
  origin: HTMLElement | null,
  apply: () => void,
  duration: number = DEFAULT_REVEAL_MS,
): void {
  const root = document.documentElement;

  // A second click mid-reveal switches immediately: swallowing it would feel
  // broken, and nested view transitions are not a thing.
  if (!shouldRevealThemeChange() || transitioning) {
    apply();
    return;
  }

  const rect = origin?.getBoundingClientRect() ?? {
    top: 0,
    left: window.innerWidth,
    width: 0,
    height: 0,
  };
  const { x, y } = circleOrigin(rect, {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const cleanup = () => {
    transitioning = false;
    root.removeAttribute(THEME_TRANSITION_ATTR);
    root.style.removeProperty('--vt-x');
    root.style.removeProperty('--vt-y');
    root.style.removeProperty('--vt-duration');
  };

  root.style.setProperty('--vt-x', x);
  root.style.setProperty('--vt-y', y);
  root.style.setProperty('--vt-duration', `${duration}ms`);
  root.setAttribute(THEME_TRANSITION_ATTR, '');
  transitioning = true;

  let transition: ViewTransition;
  try {
    transition = document.startViewTransition(() => {
      apply();
    });
  } catch {
    cleanup();
    apply();
    return;
  }

  void transition.finished.then(cleanup, cleanup);
}
