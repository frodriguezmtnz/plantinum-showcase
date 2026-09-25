export type RacePhase = 'race' | 'closing' | 'final';

export interface RaceFieldPalette {
  top: string;
  mid: string;
  low: string;
  waveA: string;
  waveB: string;
  glow: string;
}

export interface RaceState {
  phase: RacePhase;
  daysLeft: number;
  monthLabel: string;
  palette: RaceFieldPalette;
}

export const PHASE_PALETTES: Record<RacePhase, RaceFieldPalette> = {
  // Month just opened: cool morning light on the field.
  race: {
    top: 'hsl(202 82% 94%)',
    mid: 'hsl(203 64% 85%)',
    low: 'hsl(206 48% 73%)',
    waveA: 'hsl(204 72% 91%)',
    waveB: 'hsl(208 42% 64%)',
    glow: 'hsl(203 90% 62%)',
  },
  // Final week: the light goes amber, the heat rule on the field.
  closing: {
    top: 'hsl(38 78% 91%)',
    mid: 'hsl(27 68% 82%)',
    low: 'hsl(210 34% 64%)',
    waveA: 'hsl(40 84% 88%)',
    waveB: 'hsl(212 30% 56%)',
    glow: 'hsl(28 92% 58%)',
  },
  // Last 48h: sunrise gold over a deep horizon; the crown is next light away.
  final: {
    top: 'hsl(44 92% 88%)',
    mid: 'hsl(30 82% 76%)',
    low: 'hsl(214 38% 54%)',
    waveA: 'hsl(46 95% 84%)',
    waveB: 'hsl(218 34% 48%)',
    glow: 'hsl(38 96% 55%)',
  },
};

export function daysUntilMonthEnd(now: Date): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
}

export function getRaceState(now: Date = new Date()): RaceState {
  const daysLeft = daysUntilMonthEnd(now);
  const phase: RacePhase = daysLeft <= 2 ? 'final' : daysLeft <= 7 ? 'closing' : 'race';
  return {
    phase,
    daysLeft,
    monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    palette: PHASE_PALETTES[phase],
  };
}
