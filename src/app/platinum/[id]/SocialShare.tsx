'use client';

import { Button } from '@/components/ui/button';
import type { Platinum, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useVotePlatinum } from '@/hooks/use-vote-platinum';
import { VoteHeart } from '@/components/shared/vote-heart';
import { ShareButton } from '@/components/shared/share-button';

interface SocialShareProps {
  platinum: Platinum;
  user: User | null;
}

export function SocialShare({ platinum, user }: SocialShareProps) {
  const { hasVoted, votes, burstSeq, isPending, isOwner, toggleVote } = useVotePlatinum({
    platinumId: platinum.id,
    ownerId: platinum.userId,
    initialVotes: platinum.votes,
    initialMonthlyVotes: platinum.monthlyVotes,
    initialHasVoted: platinum.hasVoted ?? false,
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        className={cn(
          "min-w-0 flex-1 rounded-full px-4 transition-all hover:shadow-lift",
          // The burst plays while the vote is in flight; the base disabled
          // opacity would wash it out to grey. Only the owner stays dimmed.
          !isOwner && "disabled:opacity-100",
          hasVoted &&
            "bg-destructive/10 text-[var(--vote-red)] ring-1 ring-destructive/30 hover:bg-destructive/15",
        )}
        size="lg"
        onClick={toggleVote}
        disabled={isPending || isOwner}
        title={
          isOwner
            ? 'You can\u2019t vote for your own platinum'
            : hasVoted
              ? `Voted \u00b7 click to undo (${votes})`
              : 'Vote for this platinum'
        }
        aria-label={
          isOwner
            ? 'You can\u2019t vote for your own platinum'
            : hasVoted
              ? `Remove vote (${votes})`
              : `Vote for this platinum (${votes})`
        }
        aria-pressed={hasVoted}
      >
        <VoteHeart hasVoted={hasVoted} burstSeq={burstSeq} size="lg" />
        {isOwner
          ? 'Yours'
          : hasVoted
            ? <span className="tabular">{votes}</span>
            : 'Vote'}
      </Button>
      <ShareButton
        platinumId={platinum.id}
        gameName={platinum.gameName}
        username={user?.username}
        size="lg"
        iconOnly
        align="end"
        className="shrink-0 px-3"
      />
    </div>
  );
}
