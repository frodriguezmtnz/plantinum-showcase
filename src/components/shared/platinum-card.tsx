'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Platinum, User } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Calendar, Eye, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface PlatinumCardProps {
  platinum: Platinum;
  user?: User;
  isPride?: boolean;
}

export function PlatinumCard({ platinum, user, isPride = false }: PlatinumCardProps) {
  const [isSpoilerVisible, setSpoilerVisible] = useState(false);
  const [votes, setVotes] = useState(platinum.monthlyVotes);
  const [isVoted, setIsVoted] = useState(false);

  const showSpoiler = isSpoilerVisible || !platinum.isSpoiler;

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation when voting
    if (isVoted) {
      setVotes(votes - 1);
      setIsVoted(false);
    } else {
      setVotes(votes + 1);
      setIsVoted(true);
    }
  };

  const handleShowSpoiler = (e: React.MouseEvent) => {
    e.preventDefault();
    setSpoilerVisible(true);
  }

  return (
    <Card className={cn("flex flex-col overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20", isPride && "border-2 border-primary shadow-primary/20")}>
      {isPride && (
        <div className="p-2 text-center bg-primary/20 text-primary-foreground font-semibold flex items-center justify-center gap-2 text-sm">
          <Award className="w-4 h-4 text-amber-400" /> My Pride
        </div>
      )}
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <Link href={`/platinum/${platinum.id}`} className="group">
            <CardTitle className="font-headline text-lg leading-tight group-hover:text-primary transition-colors">
              {platinum.gameName}
            </CardTitle>
          </Link>
          {user && (
            <Link href={`/u/${user.username}`} className="text-sm text-muted-foreground hover:text-primary">
              by {user.username}
            </Link>
          )}
        </div>
        <Badge variant="secondary">{platinum.platform}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <Link href={`/platinum/${platinum.id}`} className={cn("block aspect-[16/9] bg-muted", !showSpoiler && "platinum-card-spoiler")}>
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
        </Link>
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(parseISO(platinum.platinumDate), 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{votes}</span>
            <Button
              variant="ghost"
              size="icon"
              className={cn("vote-button", isVoted ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500")}
              onClick={handleVote}
              aria-label="Vote"
            >
              <Heart className={cn(isVoted && "fill-current")} />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
