'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Loader2, UserPlus } from 'lucide-react';
import { toggleFollow } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  className?: string;
  size?: 'default' | 'sm';
}

export function FollowButton({
  username,
  initialIsFollowing,
  className,
  size = 'default',
}: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [synced, setSynced] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  // Keep the optimistic state honest after a server refresh.
  if (synced !== initialIsFollowing) {
    setSynced(initialIsFollowing);
    setIsFollowing(initialIsFollowing);
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size={size} className={className}>
        <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || `/u/${username}`)}`}>
          <UserPlus className="h-4 w-4" />
          Follow
        </Link>
      </Button>
    );
  }

  // You can't follow yourself; the owner never sees this button anyway.
  if (user.name === username) return null;

  function onClick() {
    if (isPending) return;

    const next = !isFollowing;
    setIsFollowing(next);

    startTransition(async () => {
      const result = await toggleFollow(username);

      if (!result.success) {
        setIsFollowing(!next);
        toast({
          title: 'Follow failed',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      setIsFollowing(result.isFollowing);
      toast({
        title: result.isFollowing
          ? `Following @${username}`
          : `Unfollowed @${username}`,
        description: result.isFollowing
          ? 'Their new platinums will show up on your profile feed soon.'
          : 'You will stop seeing their updates.',
        variant: result.isFollowing ? 'success' : 'danger',
      });
    });
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? 'outline' : 'default'}
      onClick={onClick}
      disabled={isPending}
      aria-pressed={isFollowing}
      className={cn(className)}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <Check className="h-4 w-4" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
