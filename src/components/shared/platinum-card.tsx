'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlatinumTrophyIcon } from '../icons/platinum-trophy-icon';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


interface PlatinumCardProps {
  platinum: Platinum;
  user?: User;
  variant?: 'default' | 'top';
}

export function PlatinumCard({ platinum, user, variant = 'default' }: PlatinumCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    setSpoilerVisible(true);
  }

  if (variant === 'top') {
    return (
        <Link href={`/platinum/${platinum.id}`} className="group block relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
            <Image
                src={platinum.imageUrl}
                alt={`Platinum screenshot for ${platinum.gameName}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={platinum.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-4 text-white">
                <h3 className="font-semibold text-lg">{platinum.gameName}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <UserIcon className="w-4 h-4" />
                    <span>{user?.username}</span>
                </div>
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 text-white font-bold p-2 rounded-md">
                <PlatinumTrophyIcon className="w-5 h-5" />
                <span>{platinum.monthlyVotes}</span>
            </div>
        </Link>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden bg-card border-none">
       <CardContent className="p-0">
        <Link href={`/platinum/${platinum.id}`} className={cn("block aspect-[16/9] bg-muted rounded-lg overflow-hidden", !showSpoiler && "platinum-card-spoiler")}>
          <Image
            src={platinum.imageUrl}
            alt={`Platinum screenshot for ${platinum.gameName}`}
            width={platinum.width}
            height={platinum.height}
            className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-300", !showSpoiler && "spoiler-blur")}
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
        </Link>
      </CardContent>
      <div className="pt-3">
        <h3 className="font-semibold truncate">{platinum.gameName}</h3>
        <div className="flex justify-between items-center mt-1">
            {user && (
                <Link href={`/u/${user.username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.username}</span>
                </Link>
            )}
            <div className="flex items-center gap-2 text-sm font-bold">
                <PlatinumTrophyIcon className="w-4 h-4 text-gray-400" />
                <span>{platinum.monthlyVotes}</span>
            </div>
        </div>
      </div>
    </Card>
  );
}
