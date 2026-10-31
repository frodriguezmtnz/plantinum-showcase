'use client';

import { useSyncExternalStore, useState, type SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import type { Platinum, User } from '@/lib/data';
import { Facebook, Instagram, Link2, Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useVotePlatinum } from '@/hooks/use-vote-platinum';
import { VoteHeart } from '@/components/shared/vote-heart';

interface SocialShareProps {
  platinum: Platinum;
  user: User | null;
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const emptySubscribe = () => () => {};

export function SocialShare({ platinum, user }: SocialShareProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== 'undefined' && !!navigator.share,
    () => false,
  );
  const { hasVoted, votes, burstSeq, isPending, isOwner, toggleVote } = useVotePlatinum({
    platinumId: platinum.id,
    ownerId: platinum.userId,
    initialVotes: platinum.votes,
    initialMonthlyVotes: platinum.monthlyVotes,
    initialHasVoted: platinum.hasVoted ?? false,
  });

  const getShareUrl = () => window.location.origin + pathname;
  const shareText = `Check out this platinum trophy for ${platinum.gameName} on Platinum Showcase!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: 'Link Copied!',
        description: 'The URL has been copied to your clipboard.',
      });
      return true;
    } catch (error) {
      console.error('Error copying link:', error);
      return false;
    }
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToX = () => {
    setOpen(false);
    openExternal(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`,
    );
  };

  const shareToFacebook = () => {
    setOpen(false);
    openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`);
  };

  const shareToInstagram = async () => {
    const copied = await copyLink();
    setOpen(false);
    if (copied) {
      openExternal('https://www.instagram.com/');
    }
  };

  const handleShare = async () => {
    setOpen(false);
    const shareData = {
      title: `Platinum: ${platinum.gameName} by ${user?.username || 'a user'}`,
      text: shareText,
      url: getShareUrl(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await copyLink();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        className={cn("min-w-0 flex-1 rounded-full px-4 transition-all", hasVoted && "bg-destructive text-destructive-foreground hover:brightness-110")}
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
            ? <span className="tabular" aria-live="polite">{votes}</span>
            : 'Vote'}
      </Button>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="lg" className="shrink-0 px-3" aria-label="Share platinum">
            <Share2 />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={8} className="w-56 p-1.5">
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
              onClick={shareToX}
            >
              <XIcon />
              Share on X
            </Button>
            <Button
              variant="ghost"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
              onClick={shareToFacebook}
            >
              <Facebook />
              Share on Facebook
            </Button>
            <Button
              variant="ghost"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
              onClick={shareToInstagram}
            >
              <Instagram />
              Share on Instagram
            </Button>
            <div className="my-1 h-px bg-border" />
            <Button
              variant="ghost"
              className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
              onClick={handleShare}
            >
              {canNativeShare ? <Share2 /> : <Link2 />}
              {canNativeShare ? 'More options' : 'Copy link'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
