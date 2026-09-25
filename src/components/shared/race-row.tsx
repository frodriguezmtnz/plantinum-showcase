'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Eye, Plus } from 'lucide-react';
import { cn, isStoredImage } from '@/lib/utils';

export interface RaceEntry {
  id: string;
  gameName: string;
  imageUrl: string;
  width: number;
  height: number;
  platform: string;
  username: string;
  monthlyVotes: number;
  isSpoiler: boolean;
}

function PlateTile({ entry, rank }: { entry: RaceEntry; rank: number }) {
  return (
    <Link
      href={`/platinum/${entry.id}`}
      data-tile
      className="plate-shell group relative w-64 shrink-0 snap-center outline-none sm:w-72"
    >
      <div className="plate-bloom relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-white/70 shadow-lift">
        {entry.isSpoiler ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 panel-solid">
            <Eye className="h-5 w-5 text-muted-foreground" aria-hidden />
            <span className="field-mark">Spoiler protected</span>
          </div>
        ) : (
          <Image
            src={entry.imageUrl}
            alt={`Platinum screenshot for ${entry.gameName}`}
            fill
            sizes="288px"
            className="object-cover"
            unoptimized={isStoredImage(entry.imageUrl)}
          />
        )}
        <span className="tabular absolute left-2 top-2 rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-bold text-primary backdrop-blur-md">
          #{rank}
        </span>
      </div>
      <div className="bloom-caption absolute inset-x-2 top-full z-10 mt-3">
        <div className="panel-solid rounded-xl px-4 py-3 shadow-lift">
          <p className="truncate text-sm font-bold">{entry.gameName}</p>
          <p className="tabular mt-0.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">@{entry.username} · {entry.platform}</span>
            <span className="font-bold text-primary">{entry.monthlyVotes} votes</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

export function RaceRow({ entries }: { entries: RaceEntry[] }) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const deep = () => document.body.setAttribute('data-bloom', 'deep');
    const rest = () => document.body.removeAttribute('data-bloom');
    row.addEventListener('mouseenter', deep);
    row.addEventListener('mouseleave', rest);
    row.addEventListener('focusin', deep);
    row.addEventListener('focusout', rest);
    return () => {
      row.removeEventListener('mouseenter', deep);
      row.removeEventListener('mouseleave', rest);
      row.removeEventListener('focusin', deep);
      row.removeEventListener('focusout', rest);
      document.body.removeAttribute('data-bloom');
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tiles = Array.from(rowRef.current?.querySelectorAll<HTMLAnchorElement>('a[data-tile]') ?? []);
    if (tiles.length === 0) return;
    const current = document.activeElement;
    const idx = tiles.findIndex((t) => t === current);
    const next = e.key === 'ArrowRight'
      ? tiles[Math.min(idx + 1, tiles.length - 1)]
      : tiles[Math.max(idx - 1, 0)];
    const target = tiles.includes(current as HTMLAnchorElement) ? next : tiles[0];
    e.preventDefault();
    target?.focus();
    target?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div
      ref={rowRef}
      onKeyDown={onKeyDown}
      className="overflow-x-auto px-8 pb-16 pt-2 sm:px-12"
    >
      <div className={cn('flex w-max snap-x snap-mandatory gap-5', entries.length > 2 && 'mx-auto')}>
        {entries.map((entry, i) => (
          <PlateTile key={entry.id} entry={entry} rank={i + 1} />
        ))}
        <Link
          data-tile
          href="/upload"
          aria-label="Submit your own plate to this month's race"
          className="plate-shell group w-64 shrink-0 snap-center outline-none sm:w-72"
        >
          <div className="plate-bloom flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/35 bg-white/45 backdrop-blur-md group-hover:border-primary/70 group-hover:bg-white/80">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lift">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-bold text-primary">Submit a plate</span>
            <span className="text-xs text-muted-foreground">Join this month&apos;s race</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
