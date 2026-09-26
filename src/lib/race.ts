export interface RaceState {
  daysLeft: number;
  monthLabel: string;
}

export function daysUntilMonthEnd(now: Date): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export function getRaceState(now: Date = new Date()): RaceState {
  const daysLeft = daysUntilMonthEnd(now);
  return {
    daysLeft,
    monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
  };
}
