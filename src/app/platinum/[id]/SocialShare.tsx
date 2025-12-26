'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Platinum, User } from '@/lib/data';
import { Heart, Share2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface SocialShareProps {
  platinum: Platinum;
  user: User | null;
}

export function SocialShare({ platinum, user }: SocialShareProps) {
  const pathname = usePathname();
  
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
        // Silently fail is ok
      }
    } else {
        // Fallback for browsers that don't support Web Share API
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
      <Button className="w-full vote-button" size="lg">
        <Heart className="mr-2" /> Vote
      </Button>
      <Button variant="outline" size="lg" className="px-3" onClick={handleShare} aria-label="Share platinum">
        <Share2 />
      </Button>
    </div>
  );
}
