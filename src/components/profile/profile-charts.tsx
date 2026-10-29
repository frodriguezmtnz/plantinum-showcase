'use client';

import { useEffect, useRef } from 'react';
import type { EChartsType } from 'echarts/core';
import {
  PLATFORM_COLOR_FALLBACKS,
  PLATFORM_COLOR_VARS,
} from '@/lib/chart-theme';
import { formatPeriodShortLabel } from '@/lib/period';

export interface MonthPoint {
  key: string;
  count: number;
}

export interface PlatformPoint {
  platform: string;
  count: number;
}

/**
 * ECharts paints on a canvas, so it needs a concrete color. Resolving the
 * theme token through the canvas keeps light/dark in sync with the rest of
 * the UI instead of hardcoding hex values.
 */
function tokenColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const probe = document.createElement('span');
  probe.style.display = 'none';
  probe.style.color = `var(${name})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  if (!resolved) return fallback;

  const context = document.createElement('canvas').getContext('2d');
  if (!context) return fallback;
  context.fillStyle = fallback;
  context.fillStyle = resolved;
  const normalized = context.fillStyle;
  return typeof normalized === 'string' && normalized !== '#000000'
    ? normalized
    : fallback;
}

function palette(): string[] {
  return PLATFORM_COLOR_VARS.map((name, index) =>
    tokenColor(name, PLATFORM_COLOR_FALLBACKS[index] ?? '#3189c0'),
  );
}

/** Loads the ECharts modules both charts share, once per mount. */
async function loadEcharts() {
  const [core, charts, components, renderers] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ]);

  core.use([
    charts.LineChart,
    charts.PieChart,
    components.GridComponent,
    components.TooltipComponent,
    renderers.CanvasRenderer,
  ]);

  return core;
}

function useChart(
  build: (chart: EChartsType) => void,
  deps: readonly unknown[],
) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: EChartsType | null = null;
    let disposed = false;
    let observer: ResizeObserver | null = null;

    void (async () => {
      const echarts = await loadEcharts();
      const node = holder.current;
      if (disposed || !node) return;

      chart = echarts.init(node, undefined, { renderer: 'canvas' });
      build(chart);

      observer = new ResizeObserver(() => chart?.resize());
      observer.observe(node);
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      chart?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return holder;
}

interface PaceAreaProps {
  months: MonthPoint[];
  total: number;
}

/** Cumulative platinums over the selected window, as a filled line. */
export function ProfilePaceArea({ months, total }: PaceAreaProps) {
  const holder = useChart(
    (chart) => {
      const accent = tokenColor('--chart-1', '#3189c0');
      const muted = tokenColor('--muted-foreground', '#5b6770');
      const border = tokenColor('--border', '#c9d5df');
      const surface = tokenColor('--popover', '#ffffff');

      let running = 0;
      const cumulative = months.map((month) => {
        running += month.count;
        return running;
      });

      chart.setOption({
        animationDuration: 900,
        animationEasing: 'cubicOut',
        grid: { left: 4, right: 4, top: 14, bottom: 4, containLabel: true },
        tooltip: {
          trigger: 'axis',
          backgroundColor: surface,
          borderColor: border,
          borderWidth: 1,
          padding: [8, 10],
          textStyle: { color: muted, fontSize: 12 },
          axisPointer: {
            type: 'line',
            lineStyle: { color: border, width: 1, type: 'dashed' },
          },
          formatter: (params: unknown) => {
            const [point] = params as {
              axisValueLabel?: string;
              value?: number;
            }[];
            return `${point?.axisValueLabel ?? ''}<br/><strong>${point?.value ?? 0}</strong> of ${total} platinums`;
          },
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months.map((month) => formatPeriodShortLabel(month.key)),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: muted,
            fontSize: 10,
            margin: 10,
            interval: 'auto',
          },
        },
        yAxis: {
          type: 'value',
          show: false,
          splitLine: { show: false },
        },
        series: [
          {
            type: 'line',
            name: 'Platinums',
            smooth: 0.35,
            symbol: 'circle',
            // A single month has no segment to draw, so keep the point visible.
            symbolSize: months.length <= 2 ? 7 : 4,
            showSymbol: true,
            data: cumulative,
            lineStyle: { color: accent, width: 2.5 },
            itemStyle: { color: accent, borderColor: surface, borderWidth: 1.5 },
            areaStyle: {
              opacity: 0.35,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: accent },
                  { offset: 1, color: 'rgba(0,0,0,0)' },
                ],
              },
            },
            emphasis: {
              lineStyle: { width: 3 },
              itemStyle: { color: accent },
            },
          },
        ],
      });
    },
    [months, total],
  );

  return (
    <div
      ref={holder}
      role="img"
      aria-label={`Cumulative platinums: ${total} across ${months.length} months`}
      className="h-44 w-full min-w-0 overflow-hidden"
    />
  );
}

interface PlatformDonutProps {
  platforms: PlatformPoint[];
}

/** Platform split as an animated donut with a legend the page controls. */
export function ProfilePlatformDonut({ platforms }: PlatformDonutProps) {
  const holder = useChart(
    (chart) => {
      const colors = palette();
      const surface = tokenColor('--popover', '#ffffff');
      const muted = tokenColor('--muted-foreground', '#5b6770');
      const border = tokenColor('--border', '#c9d5df');

      chart.setOption({
        animationDuration: 800,
        animationEasing: 'cubicOut',
        tooltip: {
          trigger: 'item',
          backgroundColor: surface,
          borderColor: border,
          borderWidth: 1,
          padding: [8, 10],
          textStyle: { color: muted, fontSize: 12 },
          formatter: (params: unknown) => {
            const point = params as {
              name?: string;
              value?: number;
              percent?: number;
            };
            return `${point.name ?? ''}: <strong>${point.value ?? 0}</strong> (${point.percent ?? 0}%)`;
          },
        },
        series: [
          {
            type: 'pie',
            radius: ['58%', '82%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            padAngle: 1.5,
            itemStyle: {
              borderRadius: 4,
              borderColor: surface,
              borderWidth: 2,
            },
            label: { show: false },
            labelLine: { show: false },
            emphasis: { scale: true, scaleSize: 4 },
            data: platforms.map((platform, index) => ({
              name: platform.platform,
              value: platform.count,
              itemStyle: {
                color: colors[index % colors.length] ?? colors[0],
              },
            })),
          },
        ],
      });
    },
    [platforms],
  );

  const total = platforms.reduce((sum, platform) => sum + platform.count, 0);

  return (
    <div className="relative">
      <div
        ref={holder}
        role="img"
        aria-label={`Platform split: ${platforms
          .map((platform) => `${platform.platform} ${platform.count}`)
          .join(', ')}`}
        className="h-40 w-full min-w-0 overflow-hidden"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="tabular font-headline text-2xl font-bold leading-none">
          {total}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          platinums
        </span>
      </div>
    </div>
  );
}
