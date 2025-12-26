
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Platinum } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatinumDetailCardProps {
  platinum: Platinum;
}

export function PlatinumDetailCard({ platinum }: PlatinumDetailCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    setSpoilerVisible(true);
  }

  return (
    <div className={cn("block aspect-[16/9] bg-muted rounded-lg overflow-hidden relative", !showSpoiler && "platinum-card-spoiler")}>
      <Image
        src={platinum.imageUrl}
        alt={`Platinum screenshot for ${platinum.gameName}`}
        width={platinum.width}
        height={platinum.height}
        className={cn("w-full h-full object-cover", !showSpoiler && "spoiler-blur")}
        data-ai-hint={platinum.imageHint}
      />
      {!showSpoiler && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            <p className="text-lg font-bold text-white mb-4">Spoiler Warning</p>
          <Button onClick={handleShowSpoiler} variant="secondary">
            <Eye className="mr-2 h-4 w-4" /> Show Screenshot
          </Button>
        </div>
      )}
    </div>
  );
}
