'use client';

import { useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const themes = ['light', 'dark', 'system'] as const;
type Theme = (typeof themes)[number];
const labels: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
};

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return <Button variant="ghost" size="icon" aria-hidden tabIndex={-1} className={className} />;
  }

  const current: Theme = themes.includes(theme as Theme) ? (theme as Theme) : 'system';
  const next = themes[(themes.indexOf(current) + 1) % themes.length] ?? 'light';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      className={cn(className)}
      aria-label={`Theme: ${labels[current]}. Switch to ${labels[next]}`}
      title={`Theme: ${labels[current]} — switch to ${labels[next]}`}
    >
      {current === 'system' ? (
        <Monitor className="h-5 w-5" />
      ) : current === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
