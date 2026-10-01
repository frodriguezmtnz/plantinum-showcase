import { describe, expect, it } from 'vitest';
import { buildWatermark } from '@/lib/watermark';

function pillSize(svg: string): { width: number; height: number } {
  const m = svg.match(/<svg[^>]*width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/);
  expect(m, 'svg root size').not.toBeNull();
  return { width: Number(m![1]), height: Number(m![2]) };
}

describe('buildWatermark', () => {
  it('draws the site name and the hunter handle', () => {
    const { svg } = buildWatermark(1920, 1080, 'trophy-hunter-1');
    expect(svg).toContain('Platinum Showcase');
    expect(svg).toContain('@trophy-hunter-1');
  });

  it('escapes XML-hostile usernames', () => {
    const { svg } = buildWatermark(1920, 1080, '<b>&"x');
    expect(svg).toContain('&lt;b&gt;&amp;&quot;x');
    expect(svg).not.toContain('<b>&');
  });

  it('anchors the pill inside the image bounds', () => {
    const { svg, top, left } = buildWatermark(1920, 1080, 'frodriguez');
    const { width, height } = pillSize(svg);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeLessThanOrEqual(1920);
    expect(top + height).toBeLessThanOrEqual(1080);
  });

  it('clamps to a minimum pill scale on small images', () => {
    const small = pillSize(buildWatermark(640, 360, 'a').svg);
    const base = pillSize(buildWatermark(1600, 900, 'a').svg);
    expect(small.width).toBeCloseTo(base.width * 0.6, 0);
  });

  it('caps the pill scale on huge images', () => {
    const big = pillSize(buildWatermark(3840, 2160, 'a').svg);
    const huge = pillSize(buildWatermark(7680, 4320, 'a').svg);
    expect(huge.width).toBe(big.width);
  });

  it('never lets the placement go negative on tiny canvases', () => {
    const { svg, top, left } = buildWatermark(100, 100, 'someone');
    const { width, height } = pillSize(svg);
    expect(left).toBe(0);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(left + width).toBeGreaterThanOrEqual(100);
    expect(top + height).toBeLessThanOrEqual(100);
  });

  it('sits toward the bottom-left inset by at least 2.5% of the width', () => {
    const { svg, left } = buildWatermark(2000, 1200, 'frodriguez');
    const { width } = pillSize(svg);
    expect(2000 - left - width).toBeGreaterThanOrEqual(2000 * 0.025);
  });
});
