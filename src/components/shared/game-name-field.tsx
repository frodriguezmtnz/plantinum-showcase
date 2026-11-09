'use client';

import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { GameSuggestion } from '@/lib/game-types';

interface GameNameFieldProps
  extends Omit<
    React.ComponentProps<'input'>,
    'value' | 'onChange' | 'disabled' | 'placeholder' | 'id'
  > {
  value: string;
  gameId: number | null;
  onChange: (next: { name: string; gameId: number | null }) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

interface SearchResponse {
  results?: GameSuggestion[];
  configured?: boolean;
  available?: boolean;
  error?: string;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * Game title input backed by RAWG. Selecting a result pins the canonical title
 * and its `gameId`; typing invalidates the link so name and id never drift.
 * Without a server key (or on API failure) it behaves like a plain input.
 */
export const GameNameField = forwardRef<HTMLInputElement, GameNameFieldProps>(
  function GameNameField(
    {
      value,
      gameId,
      onChange,
      disabled = false,
      placeholder = 'e.g., Elden Ring',
      id,
      className,
      ...inputProps
    },
    ref,
  ) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressQueryRef = useRef<string | null>(null);
  const [results, setResults] = useState<GameSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);

  const query = value.trim();
  const tooShort = query.length < MIN_QUERY_LENGTH;

  useEffect(() => {
    if (disabled || tooShort || gameId !== null) {
      return;
    }
    // Just picked an IGDB fallback title: keep it as manual text, no re-search.
    if (suppressQueryRef.current === query.toLowerCase()) {
      suppressQueryRef.current = null;
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/games/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as SearchResponse;
        if (controller.signal.aborted) return;

        setConfigured(
          payload.configured !== false && payload.available !== false,
        );
        setResults(Array.isArray(payload.results) ? payload.results : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tooShort, gameId, disabled, refreshKey]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function selectGame(game: GameSuggestion) {
    if (game.provider === 'rawg') {
      onChange({ name: game.name, gameId: game.id });
    } else {
      // IGDB ids live in a different space than RAWG: keep the plate unlinked
      // (it still matches by normalised name) and avoid re-opening the list.
      suppressQueryRef.current = game.name.trim().toLowerCase();
      onChange({ name: game.name, gameId: null });
    }
    setOpen(false);
    setResults([]);
  }

  function clearLink() {
    onChange({ name: value, gameId: null });
    setResults([]);
    setOpen(false);
    setRefreshKey((key) => key + 1);
  }

  function handleInput(next: string) {
    suppressQueryRef.current = null;
    onChange({ name: next, gameId: null });
    setResults([]);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault();
      const game = results[activeIndex];
      if (game) selectGame(game);
    }
  }

  const showSuggestions = open && !tooShort && !disabled && gameId === null;
  const noMatches =
    showSuggestions && !loading && results.length === 0 && configured !== false;
  const activeId =
    activeIndex >= 0 && results[activeIndex]
      ? `${listId}-${results[activeIndex]!.id}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          {...inputProps}
          ref={ref}
          id={id}
          value={value}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={() => {
            if (!tooShort && gameId === null && results.length === 0) {
              setRefreshKey((key) => key + 1);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listId : undefined}
          aria-activedescendant={activeId}
          className={cn('pl-9 pr-9', className)}
        />
        {loading && !tooShort && gameId === null && (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {gameId !== null ? (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-live">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Linked to RAWG
          </span>
          <button
            type="button"
            onClick={clearLink}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Change title
          </button>
        </p>
      ) : configured === false && !tooShort ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Game search is unavailable right now. You can still type the title
          manually.
        </p>
      ) : null}

      {showSuggestions && (results.length > 0 || noMatches) && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Game search results"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {results.map((game, index) => (
            <li
              key={game.id}
              id={`${listId}-${game.id}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectGame(game)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left transition-colors',
                  index === activeIndex
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted/60',
                )}
              >
                <span className="block truncate text-sm font-medium">
                  {game.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {game.released ? game.released.slice(0, 4) : 'Year unknown'}
                  {game.provider === 'igdb' ? ' · IGDB' : ''}
                </span>
              </button>
            </li>
          ))}
          {noMatches && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No matches in RAWG. You can still use this title manually.
            </li>
          )}
        </ul>
      )}
    </div>
  );
  },
);
