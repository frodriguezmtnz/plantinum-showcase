'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, UserCheck, Users } from 'lucide-react';
import { getMoreFollowers, getMoreFollowing } from '@/app/actions';
import type { FollowListItem } from '@/lib/follows';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { FollowButton } from '@/components/shared/follow-button';
import { cn } from '@/lib/utils';

type FollowKind = 'followers' | 'following';

interface FollowListClientProps {
  username: string;
  kind: FollowKind;
  initialItems: FollowListItem[];
  initialTotal: number;
  initialHasMore: boolean;
  isOwner?: boolean;
}

const TABS: { kind: FollowKind; label: string }[] = [
  { kind: 'followers', label: 'Followers' },
  { kind: 'following', label: 'Following' },
];

export function FollowListClient({
  username,
  kind,
  initialItems,
  initialTotal,
  initialHasMore,
  isOwner = false,
}: FollowListClientProps) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  // A follow toggle calls router.refresh(); when the server list changes we
  // adopt it (e.g. the unfollowed hunter leaves the "Following" page).
  const serverKey = `${kind}|${initialTotal}|${initialItems.map((item) => item.id).join(',')}`;
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey);
    setItems(initialItems);
    setTotal(initialTotal);
    setHasMore(initialHasMore);
  }

  const EmptyIcon = kind === 'followers' ? Users : UserCheck;

  function loadMore() {
    startTransition(async () => {
      try {
        const result =
          kind === 'followers'
            ? await getMoreFollowers({ username, offset: items.length })
            : await getMoreFollowing({ username, offset: items.length });

        setItems((previous) => {
          const seen = new Set(previous.map((item) => item.id));
          return [...previous, ...result.items.filter((item) => !seen.has(item.id))];
        });
        setTotal(result.total);
        setHasMore(result.hasMore);
      } catch {
        toast({
          title: 'Could not load more',
          description: 'Something went wrong while loading the list. Please try again.',
          variant: 'danger',
        });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <Link
          href={`/u/${username}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to @{username}
        </Link>
        <h1 className="mt-2 text-3xl font-bold font-headline">
          {kind === 'followers' ? 'Followers' : 'Following'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? 'hunter' : 'hunters'}
        </p>

        <div className="mt-4 inline-flex rounded-full border border-border/70 bg-background/40 p-0.5 text-xs">
          {TABS.map((tab) => (
            <Link
              key={tab.kind}
              href={`/u/${username}/${tab.kind}`}
              aria-current={kind === tab.kind ? 'page' : undefined}
              className={cn(
                'rounded-full px-4 py-1.5 font-semibold transition-colors',
                kind === tab.kind
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {isOwner && kind === 'following' && (
        <div className="mb-6 rounded-2xl border border-dashed border-border p-4 text-center text-sm">
          <p className="text-muted-foreground">
            Plates from the hunters you follow don&apos;t live on your profile —
            they fill your feed and your monthly circle.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link
              href="/explore?source=following"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              See their plates in your feed →
            </Link>
            <Link
              href="/hall-of-fame?scope=circle"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Their monthly race →
            </Link>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={EmptyIcon}
          title={kind === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          description={
            kind === 'followers'
              ? 'When hunters follow this profile they will show up here.'
              : 'When this hunter follows someone they will show up here.'
          }
        />
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="panel-solid flex items-center gap-3 rounded-xl p-3"
              >
                <Avatar className="h-10 w-10 border border-border/60">
                  <AvatarImage src={item.avatarUrl} alt={item.username} />
                  <AvatarFallback>
                    {item.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Link
                  href={`/u/${item.username}`}
                  className="min-w-0 flex-1 truncate font-semibold transition-colors hover:text-primary"
                >
                  @{item.username}
                </Link>
                <FollowButton
                  username={item.username}
                  initialIsFollowing={item.isFollowing}
                  size="sm"
                />
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={loadMore}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Showing {items.length} of {total}
          </p>
        </>
      )}
    </div>
  );
}
