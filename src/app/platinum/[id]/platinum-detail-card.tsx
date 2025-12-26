
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Eye, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';

interface PlatinumDetailCardProps {
  platinum: Platinum;
  user: User | null;
}

function Watermark({ username }: { username: string }) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-black/50 p-2 text-xs text-white/80 opacity-70 pointer-events-none">
      <PlatinumTrophyIcon className="w-5 h-5" />
      <div>
        <p className="font-bold">Platinum Showcase</p>
        <p>@{username}</p>
      </div>
    </div>
  );
}

export function PlatinumDetailCard({ platinum, user }: PlatinumDetailCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpoilerVisible(true);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn("group/card block aspect-[16/9] bg-muted rounded-lg overflow-hidden relative cursor-zoom-in", !showSpoiler && "platinum-card-spoiler")}>
          <Image
            src={platinum.imageUrl}
            alt={`Platinum screenshot for ${platinum.gameName}`}
            width={platinum.width}
            height={platinum.height}
            className={cn("w-full h-full object-cover transition-transform group-hover/card:scale-105", !showSpoiler && "spoiler-blur")}
            data-ai-hint={platinum.imageHint}
          />
          {user && showSpoiler && <Watermark username={user.username} />}
          {!showSpoiler && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
                <p className="text-lg font-bold text-white mb-4">Spoiler Warning</p>
              <Button onClick={handleShowSpoiler} variant="secondary">
                <Eye className="mr-2 h-4 w-4" /> Show Screenshot
              </Button>
            </div>
          )}
           <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
              <div className="bg-background/80 text-foreground p-2 rounded-full shadow-lg">
                <Expand className="w-5 h-5" />
              </div>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full p-2 bg-transparent border-none">
        <div className="relative aspect-[16/9]">
           <Image
              src={platinum.imageUrl}
              alt={`Platinum screenshot for ${platinum.gameName}`}
              fill
              className="object-contain"
              data-ai-hint={platinum.imageHint}
            />
            {user && <Watermark username={user.username} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

