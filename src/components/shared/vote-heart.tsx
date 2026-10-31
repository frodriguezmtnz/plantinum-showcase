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
  /** The detail CTA turns alert-red, so its heart and burst are white. */
  tone?: 'destructive' | 'onSolid';
  className?: string;
}

/**
 * The vote heart and its one-shot like burst. The pop, ring and sparks run in
 * pure CSS (globals.css). The burst uses an explicit tone instead of
 * `currentColor`: the button transitions its color from muted-ink to
 * alert-red over 200ms, which would paint the first frames of the burst grey.
 */
export function VoteHeart({
  hasVoted,
  burstSeq,
  size = 'sm',
  tone = 'destructive',
  className,
}: VoteHeartProps) {
  const burst = burstSeq > 0;

  return (
    <span
      data-tone={tone}
      className={cn('vote-heart', size === 'lg' && 'vote-heart--lg', className)}
    >
      <span
        key={burstSeq}
        className={cn('vote-heart-icon', burst && 'vote-heart-icon--pop')}
      >
        <Heart
          aria-hidden="true"
          className={cn(
            'vote-heart-svg transition-transform duration-200',
            hasVoted && 'scale-110',
            hasVoted ? (tone === 'onSolid' ? 'fill-white' : 'fill-destructive') : 'fill-none',
          )}
        />
        {burst && (
          <span className="vote-heart-burst" aria-hidden="true">
            <span className="vote-heart-flash" />
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
