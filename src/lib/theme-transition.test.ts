import { describe, expect, it } from 'vitest';
import { circleOrigin } from './theme-transition';

const viewport = { width: 1440, height: 900 };

describe('circleOrigin', () => {
  it('centres on the middle of the viewport', () => {
    const origin = circleOrigin(
      { top: 490, left: 490, width: 20, height: 20 },
      { width: 1000, height: 1000 },
    );

    expect(origin).toEqual({ x: '50%', y: '50%' });
  });

  it('anchors on the header toggle in the top-right corner', () => {
    const origin = circleOrigin({ top: 18, left: 1380, width: 40, height: 40 }, viewport);

    expect(origin).toEqual({ x: '97.22%', y: '4.22%' });
  });

  it('anchors on a toggle inside the mobile sheet, near the bottom', () => {
    const origin = circleOrigin({ top: 720, left: 330, width: 40, height: 40 }, viewport);

    expect(origin).toEqual({ x: '24.31%', y: '82.22%' });
  });

  it('clamps a box that overflows the viewport', () => {
    const origin = circleOrigin({ top: -40, left: 1500, width: 80, height: 80 }, viewport);

    expect(origin).toEqual({ x: '100%', y: '0%' });
  });

  it('falls back to the top-right corner when the viewport has no size', () => {
    const origin = circleOrigin({ top: 0, left: 0, width: 0, height: 0 }, { width: 0, height: 0 });

    expect(origin).toEqual({ x: '100%', y: '0%' });
  });
});
