'use client';

import { useRef, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { revealThemeChange } from '@/lib/theme-transition';
import { cn } from '@/lib/utils';

const themes = ['light', 'dark', 'system'] as const;
type Theme = (typeof themes)[number];
type ResolvedTheme = 'light' | 'dark';
const labels: Record<Theme, string> = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
};

const emptySubscribe = () => () => {};

function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function isResolved(theme: string | undefined): theme is ResolvedTheme {
  return theme === 'light' || theme === 'dark';
}

/**
 * next-themes applies the class from an effect, which runs after the View
 * Transitions snapshot has been taken. Flipping it here, synchronously, is what
 * makes the "new" snapshot the new world; `setTheme` still runs for state,
 * storage and the rest of the app.
 */
function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, systemTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (!hydrated) {
    return <Button variant="ghost" size="icon" aria-hidden tabIndex={-1} className={className} />;
  }

  const current: Theme = themes.includes(theme as Theme) ? (theme as Theme) : 'system';
  const next = themes[(themes.indexOf(current) + 1) % themes.length] ?? 'light';
  const nextResolved = next === 'system' ? systemTheme : next;

  const cycle = () => {
    // dark -> system (or system -> light while the OS is already light) changes
    // the label, not a pixel: there is nothing to reveal.
    if (!isResolved(nextResolved) || nextResolved === resolvedTheme) {
      setTheme(next);
      return;
    }

    revealThemeChange(buttonRef.current, () => {
      applyTheme(nextResolved);
      setTheme(next);
    });
  };

  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon"
      onClick={cycle}
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
