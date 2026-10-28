'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Loader2, UserMinus, UserPlus } from 'lucide-react';
import { toggleFollow } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ToastAction } from '@/components/ui/toast';
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
  const router = useRouter();
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
      // Keep lists and header counts in sync without a full navigation.
      router.refresh();

      if (result.isFollowing) {
        toast({
          title: `Following @${username}`,
          description: 'Their new platinums will show up on your profile feed soon.',
          variant: 'success',
        });
        return;
      }

      // Unfollowed: a single tap is easy to regret (especially on touch),
      // so the toast offers a one-click re-follow.
      toast({
        title: `Unfollowed @${username}`,
        description: 'You will stop seeing their updates.',
        variant: 'danger',
        action: (
          <ToastAction
            altText="Undo unfollow"
            onClick={() => {
              startTransition(async () => {
                const restored = await toggleFollow(username);
                if (!restored.success) {
                  toast({
                    title: 'Could not undo',
                    description: restored.error,
                    variant: 'danger',
                  });
                  return;
                }
                setIsFollowing(restored.isFollowing);
                router.refresh();
              });
            }}
          >
            Undo
          </ToastAction>
        ),
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
      aria-label={isFollowing ? `Unfollow @${username}` : `Follow @${username}`}
      className={cn(
        'group',
        isFollowing &&
          'hover:border-destructive hover:text-destructive focus-visible:border-destructive focus-visible:text-destructive',
        className,
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <span className="grid place-items-center">
          <Check className="col-start-1 row-start-1 h-4 w-4 group-hover:opacity-0 group-focus-visible:opacity-0" />
          <UserMinus className="col-start-1 row-start-1 h-4 w-4 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </span>
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {isFollowing ? (
        // Stacked labels keep the button width stable while swapping copy.
        <span className="grid place-items-center">
          <span className="col-start-1 row-start-1 group-hover:opacity-0 group-focus-visible:opacity-0">
            Following
          </span>
          <span className="col-start-1 row-start-1 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
            Unfollow
          </span>
        </span>
      ) : (
        'Follow'
      )}
    </Button>
  );
}
