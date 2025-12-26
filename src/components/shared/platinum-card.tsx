
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Eye, Heart, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

interface PlatinumCardProps {
  platinum: Platinum;
  user?: User;
  variant?: 'default' | 'top';
  isPride?: boolean;
}

export function PlatinumCard({ platinum, user, variant = 'default', isPride = false }: PlatinumCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);
  const { user: authUser } = useAuth();
  const router = useRouter();

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    setSpoilerVisible(true);
  }

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!authUser) {
      router.push('/login');
    } else {
      // TODO: Implement vote logic
      console.log('Voted!');
    }
  };

  if (variant === 'top') {
    return (
        <Link href={`/platinum/${platinum.hash}`} className="group block relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
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
                {user && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <UserIcon className="w-4 h-4" />
                        <span>{user.username}</span>
                    </div>
                )}
            </div>
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 text-white font-bold p-2 rounded-md">
                <Heart className="w-4 h-4" />
                <span>{platinum.monthlyVotes}</span>
            </div>
        </Link>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden bg-card border-none group">
       {isPride && (
        <div className="p-2 bg-amber-400/10 text-amber-400 text-xs font-bold flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            <span>Pride of the Collection</span>
        </div>
       )}
       <CardContent className="p-0">
        <Link href={`/platinum/${platinum.hash}`} className={cn("block aspect-[16/9] bg-muted rounded-t-lg overflow-hidden relative", !showSpoiler && "platinum-card-spoiler")}>
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
      <div className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="font-semibold truncate pr-2">{platinum.gameName}</h3>
            <Badge variant="outline" className="shrink-0">{platinum.platform}</Badge>
        </div>
        <div className="flex justify-between items-center mt-2">
            {user && (
                <Link href={`/u/${user.username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.username}</span>
                </Link>
            )}
            <Button variant="ghost" size="sm" className="vote-button text-muted-foreground hover:text-primary" onClick={handleVoteClick}>
                <Heart className="mr-2" />
                <span>{platinum.votes}</span>
            </Button>
        </div>
      </div>
    </Card>
  );
}
