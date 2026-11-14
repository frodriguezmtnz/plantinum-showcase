/**
 * One-shot celebration for account milestones (verifying the email, finishing
 * the Google onboarding). Kept out of the React tree on purpose — the
 * canvas-confetti chunk only loads when the milestone actually succeeds, and
 * the motion guards match the rest of the site (`prefers-reduced-motion` and
 * `?motion=off`).
 */

const FALLBACK_COLORS = ['#e0008e', '#22c55e', '#f8fafc'];

export function shouldCelebrate(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }
  return new URLSearchParams(window.location.search).get('motion') !== 'off';
}

/** Playstation-duotone palette, read live so light/dark stay in sync. */
function brandColors(): string[] {
  if (typeof window === 'undefined') return FALLBACK_COLORS;

  const styles = getComputedStyle(document.documentElement);
  const tokens = ['--ps-pink', '--ps-green']
    .map((token) => styles.getPropertyValue(token).trim())
    .filter(Boolean);

  return [...tokens, '#f8fafc'];
}

export async function fireAccountReadyConfetti(): Promise<void> {
  if (!shouldCelebrate()) return;

  try {
    const { default: confetti } = await import('canvas-confetti');
    const colors = brandColors();
    const common = {
      colors,
      disableForReducedMotion: true,
      zIndex: 60,
      ticks: 220,
    };

    void confetti({
      ...common,
      particleCount: 110,
      spread: 78,
      startVelocity: 40,
      scalar: 0.95,
      origin: { x: 0.5, y: 0.38 },
    });

    window.setTimeout(() => {
      void confetti({
        ...common,
        particleCount: 55,
        spread: 60,
        startVelocity: 32,
        angle: 60,
        scalar: 0.8,
        origin: { x: 0.2, y: 0.5 },
      });
      void confetti({
        ...common,
        particleCount: 55,
        spread: 60,
        startVelocity: 32,
        angle: 120,
        scalar: 0.8,
        origin: { x: 0.8, y: 0.5 },
      });
    }, 140);
  } catch {
    // Decoration only: never break the success screen over it.
  }
}

/**
 * Confetti for a plate that just cleared the screener on the upload screen.
 * Fires from the bottom corners upwards like a trophy reveal, with the same
 * palette and motion guards as the account milestones.
 */
export async function firePlatinumPublishedConfetti(): Promise<void> {
  if (!shouldCelebrate()) return;

  try {
    const { default: confetti } = await import('canvas-confetti');
    const common = {
      colors: brandColors(),
      disableForReducedMotion: true,
      zIndex: 60,
      ticks: 240,
    };

    void confetti({
      ...common,
      particleCount: 90,
      spread: 100,
      startVelocity: 45,
      angle: 90,
      scalar: 1,
      origin: { x: 0.5, y: 0.72 },
    });

    window.setTimeout(() => {
      void confetti({
        ...common,
        particleCount: 60,
        spread: 70,
        startVelocity: 38,
        angle: 60,
        scalar: 0.85,
        origin: { x: 0.12, y: 0.78 },
      });
      void confetti({
        ...common,
        particleCount: 60,
        spread: 70,
        startVelocity: 38,
        angle: 120,
        scalar: 0.85,
        origin: { x: 0.88, y: 0.78 },
      });
    }, 160);
  } catch {
    // Decoration only: never break the success screen over it.
  }
}
