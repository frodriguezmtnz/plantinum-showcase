'use client';

import { useState } from 'react';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PlatinumPageItem } from '@/lib/data';
import { cn } from '@/lib/utils';

const COLUMN_PRESETS = [
  {
    value: '2',
    label: '2 columns (sm+)',
    className: 'columns-1 sm:columns-2',
    description: 'Dos por fila en todo desktop: la opción más ancha.',
  },
  {
    value: '3',
    label: '3 columns (lg+)',
    className: 'columns-1 sm:columns-2 lg:columns-3',
    description: 'Tres por fila a partir de lg (1024px).',
  },
  {
    value: '4',
    label: '4 columns (xl+)',
    className: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
    description: 'El masonry actual de Explore, cuatro por fila en xl.',
  },
] as const;

type ColumnPreset = (typeof COLUMN_PRESETS)[number]['value'];

export function GalleryColumnsPreview({ items }: { items: PlatinumPageItem[] }) {
  const [preset, setPreset] = useState<ColumnPreset>('4');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const columns = COLUMN_PRESETS.find((option) => option.value === preset)!;

  return (
    <section className="container py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="field-mark">Preview</span>
          <h1 className="font-headline mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            Gallery Columns Playground
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Decide si el grid de Explore debe mostrar 2 o 3 platinos por fila en
            desktop. Cambia el preset de columnas y la vista en vivo con datos
            reales.
          </p>
        </div>
      </div>

      <div className="panel mb-8 flex flex-wrap items-center gap-4 rounded-2xl p-4">
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <label htmlFor="gallery-columns-preset" className="shrink-0 text-sm font-medium">
            Columns:
          </label>
          <Select value={preset} onValueChange={(value) => setPreset(value as ColumnPreset)}>
            <SelectTrigger id="gallery-columns-preset" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLUMN_PRESETS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <span className="text-sm font-medium">View:</span>
          <div
            className="inline-flex rounded-full border border-border/70 bg-background/40 p-0.5"
            role="group"
            aria-label="Gallery view"
          >
            <Button
              type="button"
              size="sm"
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              className="h-8 rounded-full px-3"
              onClick={() => setView('grid')}
              aria-pressed={view === 'grid'}
            >
              Grid
            </Button>
            <Button
              type="button"
              size="sm"
              variant={view === 'list' ? 'secondary' : 'ghost'}
              className="h-8 rounded-full px-3"
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
            >
              List
            </Button>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{columns.description}</p>

      {view === 'grid' ? (
        <div className={cn('gap-6', columns.className)}>
          {items.map((item, index) => (
            <div key={item.platinum.id} className="mb-6 break-inside-avoid">
              <PlatinumCard
                platinum={item.platinum}
                user={item.user}
                layout="grid"
                priority={index < 4}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <PlatinumCard
              key={item.platinum.id}
              platinum={item.platinum}
              user={item.user}
              layout="list"
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </section>
  );
}
