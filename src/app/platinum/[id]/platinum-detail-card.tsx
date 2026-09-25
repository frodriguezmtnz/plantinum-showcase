
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Eye, Expand } from 'lucide-react';
import { cn, isStoredImage } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';

interface PlatinumDetailCardProps {
  platinum: Platinum;
  user: User | null;
}

function Watermark({ username }: { username: string }) {
  return (
    <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-[hsl(212_38%_16%/0.6)] p-2 pr-3 text-xs text-white/85 opacity-80 pointer-events-none backdrop-blur-sm">
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
        <div className={cn("group/card block aspect-[16/9] bg-muted rounded-xl overflow-hidden relative cursor-zoom-in ring-1 ring-white/70 shadow-lift", !showSpoiler && "platinum-card-spoiler")}>
          <Image
            src={platinum.imageUrl}
            alt={`Platinum screenshot for ${platinum.gameName}`}
            width={platinum.width}
            height={platinum.height}
            className={cn("w-full h-full object-cover transition-transform group-hover/card:scale-105", !showSpoiler && "spoiler-blur")}
            data-ai-hint={platinum.imageHint}
            unoptimized={isStoredImage(platinum.imageUrl)}
          />
          {user && showSpoiler && <Watermark username={user.username} />}
          {!showSpoiler && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[hsl(210_60%_99%/0.86)] backdrop-blur-[2px] z-20">
                <p className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  Spoiler protected
                </p>
              <Button onClick={handleShowSpoiler} variant="outline">
                Reveal screenshot
              </Button>
            </div>
          )}
           <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
              <div className="panel-solid text-foreground p-2 rounded-full shadow-lift">
                <Expand className="w-5 h-5" />
              </div>
            </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full p-2 bg-transparent border-none">
        <DialogTitle className="sr-only">Enlarged screenshot for {platinum.gameName}</DialogTitle>
        {user && <DialogDescription className="sr-only">Uploaded by {user.username}</DialogDescription>}
        <div className="relative aspect-[16/9]">
           <Image
              src={platinum.imageUrl}
              alt={`Platinum screenshot for ${platinum.gameName}`}
              fill
              className="object-contain"
              data-ai-hint={platinum.imageHint}
              unoptimized={isStoredImage(platinum.imageUrl)}
            />
            {user && <Watermark username={user.username} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
