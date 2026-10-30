/**
 * Tokens the charts (canvas) and their HTML legends share. Kept in a plain
 * module: values re-exported from a "use client" file are not available while
 * a Server Component renders.
 */
export const PLATFORM_COLOR_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
] as const;

/** Fallbacks for the first paint, before the CSS variables can be resolved. */
export const PLATFORM_COLOR_FALLBACKS = [
  '#3189c0',
  '#e8862a',
  '#3d8f7d',
  '#e7b427',
  '#6e63b8',
] as const;
