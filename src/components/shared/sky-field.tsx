'use client';

import { useEffect, useRef } from 'react';
import type { RaceFieldPalette } from '@/lib/race';

const WAVE_LAYERS = [
  { base: 0.52, amp: 0.055, freq: 1.35, speed: 0.020, alpha: 0.55 },
  { base: 0.66, amp: 0.075, freq: 0.9, speed: -0.014, alpha: 0.5 },
  { base: 0.8, amp: 0.09, freq: 0.62, speed: 0.009, alpha: 0.65 },
] as const;

function hslParts(color: string): [number, number, number] {
  const m = color.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
  if (!m) return [200, 50, 80];
  return [parseFloat(m[1] ?? '200'), parseFloat(m[2] ?? '50'), parseFloat(m[3] ?? '80')];
}

function toRgba(color: string, alpha: number): string {
  const [h, s, l] = hslParts(color);
  return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
}

export function SkyField({ palette }: { palette: RaceFieldPalette }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    type Triple = [number, number, number];
    const to: [Triple, Triple, Triple] = [
      hslParts(palette.top),
      hslParts(palette.mid),
      hslParts(palette.low),
    ];
    const live: [Triple, Triple, Triple] = [
      [...to[0]],
      [...to[1]],
      [...to[2]],
    ];

    let raf = 0;
    let t = 0;
    let w = 0;
    let hgt = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      hgt = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(hgt * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${hgt}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const mix = (i: 0 | 1 | 2) => {
      const l = live[i];
      const d = to[i];
      l[0] += (d[0] - l[0]) * 0.02;
      l[1] += (d[1] - l[1]) * 0.02;
      l[2] += (d[2] - l[2]) * 0.02;
      return `hsl(${l[0].toFixed(1)} ${l[1].toFixed(1)}% ${l[2].toFixed(1)}%)`;
    };

    const drawWave = (
      layer: (typeof WAVE_LAYERS)[number],
      crest: string,
      trough: string,
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, hgt);
      const y0 = hgt * layer.base;
      for (let x = 0; x <= w; x += 12) {
        const u = x / w;
        const y =
          y0 +
          Math.sin(u * Math.PI * 2 * layer.freq + t * layer.speed * Math.PI * 2) *
            hgt *
            layer.amp +
          Math.sin(u * Math.PI * 2 * (layer.freq * 2.3) - t * layer.speed * Math.PI) *
            hgt *
            (layer.amp * 0.35);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, hgt);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, y0 - hgt * 0.08, 0, hgt);
      grad.addColorStop(0, crest);
      grad.addColorStop(1, trough);
      ctx.fillStyle = grad;
      ctx.globalAlpha = layer.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, hgt);
      g.addColorStop(0, mix(0));
      g.addColorStop(0.55, mix(1));
      g.addColorStop(1, mix(2));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, hgt);

      // Horizon light: the low sun of the browse screen.
      const sun = ctx.createRadialGradient(w * 0.5, hgt * 0.98, 10, w * 0.5, hgt * 0.98, hgt * 0.75);
      sun.addColorStop(0, toRgba(palette.glow, 0.28));
      sun.addColorStop(1, toRgba(palette.glow, 0));
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, hgt);

      drawWave(WAVE_LAYERS[0], toRgba(palette.waveA, 0.9), toRgba(palette.waveA, 0.25));
      drawWave(WAVE_LAYERS[1], toRgba(palette.waveB, 0.35), toRgba(palette.waveB, 0.6));
      drawWave(WAVE_LAYERS[2], toRgba(palette.waveB, 0.65), toRgba(palette.waveB, 0.92));
    };

    const step = () => {
      t += 1;
      draw();
      raf = requestAnimationFrame(step);
    };

    resize();
    draw();
    if (!reduced) {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => {
      resize();
      draw();
    };
    window.addEventListener('resize', onResize);
    const onVisibility = () => {
      if (reduced) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [palette]);

  return (
    <div ref={wrapRef} className="sky-field" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
