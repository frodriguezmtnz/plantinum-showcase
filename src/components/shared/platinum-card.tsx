'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Eye, Heart, Quote } from 'lucide-react';
import { cn, isStoredImage } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DeletePlatinumButton } from '@/components/shared/delete-platinum-button';
import { EditPlatinumDialog } from '@/components/shared/edit-platinum-dialog';
import { useVotePlatinum } from '@/hooks/use-vote-platinum';

interface PlatinumCardProps {
  platinum: Platinum;
  user?: User;
  isPride?: boolean;
  showComment?: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  cover?: boolean;
}

export function PlatinumCard({ platinum, user, isPride = false, showComment = false, canDelete = false, canEdit = false, cover = false }: PlatinumCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);
  const { hasVoted, votes, isPending, isOwner, toggleVote } = useVotePlatinum({
    platinumId: platinum.id,
    ownerId: platinum.userId,
    initialVotes: platinum.votes,
    initialMonthlyVotes: platinum.monthlyVotes,
    initialHasVoted: platinum.hasVoted ?? false,
  });

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;
  const frameStyle = cover ? undefined : { aspectRatio: `${platinum.width} / ${platinum.height}` };

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpoilerVisible(true);
  }

  const handleVoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleVote();
  };

  return (
    <Card className={cn("panel-solid flex flex-col overflow-hidden group rounded-xl animate-in fade-in slide-in-from-bottom-3 duration-500 shadow-lift transition-shadow duration-300 hover:shadow-bloom focus-within:shadow-bloom", isPride && "ring-2 ring-primary/60")}>
       {isPride && (
        <div className="bg-primary/10 text-primary text-xs font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-2 py-2.5">
            <Award className="w-4 h-4 text-primary" />
            <span>Pride of the Collection</span>
        </div>
       )}
       <CardContent className="p-0">
        <div
          className={cn("relative overflow-hidden bg-muted", cover ? "aspect-video" : "", !showSpoiler && "platinum-card-spoiler")}
          style={cover ? undefined : frameStyle}
        >
          <Link
            href={`/platinum/${platinum.id}`}
            aria-label={`View ${platinum.gameName}`}
            className="block h-full w-full"
          >
            <Image
              src={platinum.imageUrl}
              alt={`Platinum screenshot for ${platinum.gameName}`}
              width={platinum.width}
              height={platinum.height}
              className={cn("h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300", !showSpoiler && "spoiler-blur")}
              data-ai-hint={platinum.imageHint}
              unoptimized={isStoredImage(platinum.imageUrl)}
            />
          </Link>
          {!showSpoiler && (
            <div className="spoiler-frost-strong absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
              <p className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Eye className="w-5 h-5 text-muted-foreground" />
                Spoiler protected
              </p>
              <Button onClick={handleShowSpoiler} variant="outline">
                Reveal screenshot
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold truncate pr-2">{platinum.gameName}</h3>
            <Badge variant="outline" className="shrink-0">{platinum.platform}</Badge>
        </div>
        {showComment && platinum.comment && (
          <div className="mt-2 flex gap-2 text-sm text-muted-foreground">
            <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="italic line-clamp-2" title={platinum.comment}>{platinum.comment}</p>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
            {user ? (
                <Link href={`/u/${user.username}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} alt={user.username} />
                        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.username}</span>
                </Link>
            ) : <span />}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn("vote-button max-sm:h-11 transition-colors", hasVoted ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
                onClick={handleVoteClick}
                disabled={isPending || isOwner}
                title={
                  isOwner
                    ? "You can't vote for your own platinum"
                    : hasVoted
                      ? 'Click to undo your vote'
                      : 'Vote for this platinum'
                }
                aria-label={hasVoted ? 'Remove vote' : 'Vote for platinum'}
              >
                  <Heart className={cn("mr-2 transition-all", hasVoted && "fill-destructive scale-110")} />
                  <span className="tabular">{votes}</span>
              </Button>
              {canEdit && <EditPlatinumDialog platinum={platinum} />}
              {canDelete && <DeletePlatinumButton platinumId={platinum.id} />}
            </div>
        </div>
      </div>
    </Card>
  );
}
