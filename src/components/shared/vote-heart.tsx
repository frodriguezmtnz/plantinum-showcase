'use client';

import { Heart } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

const SPARK_COUNT = 8;

interface VoteHeartProps {
  hasVoted: boolean;
  /** Increments once per like; 0 keeps the heart still (mount, unlike). */
  burstSeq: number;
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * The vote heart and its one-shot like burst. The pop, ring and sparks run in
 * pure CSS (globals.css) and inherit `currentColor`, so the same component
 * reads destructive-red on the card and white on the filled detail button.
 */
export function VoteHeart({ hasVoted, burstSeq, size = 'sm', className }: VoteHeartProps) {
  const burst = burstSeq > 0;

  return (
    <span className={cn('vote-heart', size === 'lg' && 'vote-heart--lg', className)}>
      <span
        key={burstSeq}
        className={cn('vote-heart-icon', burst && 'vote-heart-icon--pop')}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            'vote-heart-svg transition-[color,fill,transform] duration-200',
            hasVoted ? 'fill-current scale-110' : 'fill-none',
          )}
        />
        {burst && (
          <span className="vote-heart-burst" aria-hidden="true">
            <span className="vote-heart-ring" />
            {Array.from({ length: SPARK_COUNT }, (_, i) => (
              <span
                key={i}
                className="vote-heart-spark"
                style={{ '--i': i } as CSSProperties}
              />
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
