'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Platinum, User } from '@/lib/data';
import { Heart, Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVotePlatinum } from '@/hooks/use-vote-platinum';

interface SocialShareProps {
  platinum: Platinum;
  user: User | null;
}

export function SocialShare({ platinum, user }: SocialShareProps) {
  const pathname = usePathname();
  const { hasVoted, votes, isPending, isOwner, toggleVote } = useVotePlatinum({
    platinumId: platinum.id,
    ownerId: platinum.userId,
    initialVotes: platinum.votes,
    initialMonthlyVotes: platinum.monthlyVotes,
    initialHasVoted: platinum.hasVoted ?? false,
  });

  const handleShare = async () => {
    const shareData = {
      title: `Platinum: ${platinum.gameName} by ${user?.username || 'a user'}`,
      text: `Check out this platinum trophy for ${platinum.gameName} on Platinum Showcase!`,
      url: window.location.origin + pathname,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(shareData.url).then(() => {
            toast({
                title: "Link Copied!",
                description: "The URL has been copied to your clipboard.",
            });
        });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        className={cn("min-w-0 flex-1 rounded-full px-4 vote-button transition-colors", hasVoted ? "bg-red-500 hover:bg-red-600 text-white" : "shadow-none hover:shadow-spot")}
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
              : 'Vote for this platinum'
        }
      >
        <Heart className={cn("transition-all", hasVoted && "fill-white scale-110")} />
        {isOwner
          ? 'Yours'
          : hasVoted
            ? votes
            : 'Vote'}
      </Button>
      <Button variant="outline" size="lg" className="shrink-0 px-3" onClick={handleShare} aria-label="Share platinum">
        <Share2 />
      </Button>
    </div>
  );
}
