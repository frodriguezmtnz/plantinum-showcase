const PERIOD_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
});

// Period labels are plain "YYYY-MM" strings parsed on the UTC calendar, so the
// month name must be read on the same clock or it can slip a month at the edge.
const PERIOD_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

export function getCurrentPeriod(date: Date = new Date()): string {
  const parts = PERIOD_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

/** Move a "YYYY-MM" period by whole months (negative goes back). */
export function shiftPeriod(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1 + delta, 1));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** The calendar month before the given date, on the Europe/Madrid clock. */
export function getPreviousPeriod(date: Date = new Date()): string {
  return shiftPeriod(getCurrentPeriod(date), -1);
}

/** "2026-09" → "September 2026". */
export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number);
  return PERIOD_LABEL_FORMATTER.format(new Date(Date.UTC(year!, month! - 1, 1)));
}

/** The countdown line shown next to the live race. */
export function closeCopy(daysLeft: number): string {
  if (daysLeft <= 0) return 'polls close today';
  if (daysLeft === 1) return 'polls close tomorrow';
  return `polls close in ${daysLeft} days`;
}
