'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Platinum, User } from '@/lib/data';
import { Heart, Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  platinum: Platinum;
  user: User | null;
}

export function SocialShare({ platinum, user }: SocialShareProps) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(platinum.votes);

  const handleVote = () => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    if (hasVoted) return;
    setHasVoted(true);
    setVoteCount(prev => prev + 1);
    toast({ title: '¡Voto registrado!', description: `Votaste por ${platinum.gameName}.` });
  };

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
        className={cn("w-full vote-button transition-colors", hasVoted ? "bg-red-500 hover:bg-red-600 text-white" : "")}
        size="lg"
        onClick={handleVote}
      >
        <Heart className={cn("mr-2 transition-all", hasVoted && "fill-white scale-110")} />
        {hasVoted ? `Voted (${voteCount})` : `Vote (${voteCount})`}
      </Button>
      <Button variant="outline" size="lg" className="px-3" onClick={handleShare} aria-label="Share platinum">
        <Share2 />
      </Button>
    </div>
  );
}