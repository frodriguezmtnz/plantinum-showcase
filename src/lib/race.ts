export interface RaceState {
  daysLeft: number;
  monthLabel: string;
}

// The race and the upload quota reset on Europe/Madrid calendar months, so the
// countdown copy must read the same clock — the server runs in UTC on Vercel.
const MADRID_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Madrid',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Madrid',
  month: 'long',
  year: 'numeric',
});

function madridDate(now: Date): { year: number; month: number; day: number } {
  const parts = MADRID_PARTS.formatToParts(now);
  const find = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: find('year'), month: find('month'), day: find('day') };
}

export function daysUntilMonthEnd(now: Date): number {
  const { year, month, day } = madridDate(now);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return lastDay - day;
}

export function getRaceState(now: Date = new Date()): RaceState {
  return {
    daysLeft: daysUntilMonthEnd(now),
    monthLabel: MONTH_LABEL.format(now),
  };
}
