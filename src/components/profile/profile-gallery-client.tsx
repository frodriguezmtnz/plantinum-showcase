'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { Platinum, User } from '@/lib/data';
import {
  DEFAULT_PROFILE_PLATFORM,
  DEFAULT_PROFILE_SORT,
  DEFAULT_PROFILE_VIEW,
  PROFILE_PLATFORM_FILTERS,
  PROFILE_SORTS,
  type ProfilePlatformFilter,
  type ProfileSort,
  type ProfileView,
} from '@/lib/profile-gallery';
import { getMoreProfilePlatinums } from '@/app/actions';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Loader2, SearchX, Trophy } from 'lucide-react';

const GALLERY_COLUMNS = {
  1: 'columns-1',
  2: 'columns-1 sm:columns-2',
  3: 'columns-1 sm:columns-2 lg:columns-3',
  4: 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4',
} as const;

function galleryColumnsClass(count: number): string {
  if (count <= 1) return GALLERY_COLUMNS[1];
  if (count === 2) return GALLERY_COLUMNS[2];
  if (count === 3 || count === 5 || count === 6 || count === 9) {
    return GALLERY_COLUMNS[3];
  }
  return GALLERY_COLUMNS[4];
}

interface ProfileGalleryClientProps {
  username: string;
  user: User;
  isOwner: boolean;
  initialItems: Platinum[];
  initialTotal: number;
  initialHasMore: boolean;
  platform: ProfilePlatformFilter;
  sort: ProfileSort;
  view: ProfileView;
  infinite: boolean;
  pace: 'active' | 'all';
}

function GhostCard() {
  return (
    <div className="panel-solid mb-6 break-inside-avoid rounded-2xl p-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

function ListGhostCard() {
  return (
    <div className="panel-solid flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center">
      <Skeleton className="aspect-video w-full rounded-xl sm:w-64" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function ProfileGalleryClient({
  username,
  user,
  isOwner,
  initialItems,
  initialTotal,
  initialHasMore,
  platform,
  sort,
  view,
  infinite,
  pace,
}: ProfileGalleryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [platformFilter, setPlatformFilter] = useState(platform);
  const [sortOrder, setSortOrder] = useState(sort);

  const serverKey = `${platform}|${sort}`;
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey);
    setItems(initialItems);
    setTotal(initialTotal);
    setHasMore(initialHasMore);
  }

  const updateUrl = useCallback(
    (next: {
      platform?: string;
      sort?: string;
      view?: string;
      infinite?: boolean;
    }) => {
      const nextPlatform = next.platform ?? platformFilter;
      const nextSort = next.sort ?? sortOrder;
      const nextView = next.view ?? view;
      const nextInfinite = next.infinite ?? infinite;
      const params = new URLSearchParams();

      if (pace === 'all') params.set('pace', 'all');
      if (nextPlatform !== DEFAULT_PROFILE_PLATFORM) {
        params.set('platform', nextPlatform);
      }
      if (nextSort !== DEFAULT_PROFILE_SORT) params.set('sort', nextSort);
      if (nextView !== DEFAULT_PROFILE_VIEW) params.set('view', nextView);
      if (nextInfinite) params.set('infinite', 'on');

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [infinite, pace, pathname, platformFilter, router, sortOrder, view],
  );

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value as ProfilePlatformFilter);
    updateUrl({ platform: value });
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value as ProfileSort);
    updateUrl({ sort: value });
  };

  const handleViewChange = (next: ProfileView) => {
    if (next !== view) updateUrl({ view: next });
  };

  const handleInfiniteChange = (checked: boolean) => {
    updateUrl({ infinite: checked });
  };

  const handleClearFilters = () => {
    setPlatformFilter(DEFAULT_PROFILE_PLATFORM);
    setSortOrder(DEFAULT_PROFILE_SORT);
    updateUrl({
      platform: DEFAULT_PROFILE_PLATFORM,
      sort: DEFAULT_PROFILE_SORT,
    });
  };

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const result = await getMoreProfilePlatinums({
        username,
        platform: platformFilter,
        sort: sortOrder,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch {
      toast({
        title: 'Could not load more platinums',
        description: 'The next page failed to arrive. Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = () => {
      if (hasMore && !isLoadingMore && !isPending) void handleLoadMore();
    };
  });

  useEffect(() => {
    if (!infinite) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [infinite]);

  const hasFilters =
    platformFilter !== DEFAULT_PROFILE_PLATFORM ||
    sortOrder !== DEFAULT_PROFILE_SORT;

  return (
    <div>
      <Card className="panel mb-6 rounded-2xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 items-center gap-2">
            <label
              htmlFor="profile-platform"
              className="shrink-0 text-sm font-medium"
            >
              Platform:
            </label>
            <Select value={platformFilter} onValueChange={handlePlatformChange}>
              <SelectTrigger id="profile-platform" className="w-full">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_PLATFORM_FILTERS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 items-center gap-2">
            <label htmlFor="profile-sort" className="shrink-0 text-sm font-medium">
              Sort by:
            </label>
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger id="profile-sort" className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_SORTS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <span className="text-sm font-medium">View:</span>
            <div
              className="inline-flex rounded-full border border-border/70 bg-background/40 p-0.5"
              role="group"
              aria-label="Gallery view"
            >
              <Button
                type="button"
                size="sm"
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                className="h-8 rounded-full px-3"
                onClick={() => handleViewChange('grid')}
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid className="mr-1.5 h-4 w-4" aria-hidden />
                Grid
              </Button>
              <Button
                type="button"
                size="sm"
                variant={view === 'list' ? 'secondary' : 'ghost'}
                className="h-8 rounded-full px-3"
                onClick={() => handleViewChange('list')}
                aria-pressed={view === 'list'}
              >
                <List className="mr-1.5 h-4 w-4" aria-hidden />
                List
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Switch
              id="profile-infinite"
              checked={infinite}
              onCheckedChange={handleInfiniteChange}
            />
            <label htmlFor="profile-infinite" className="text-sm font-medium">
              Infinite scroll
            </label>
          </div>
        </div>
      </Card>

      {items.length > 0 ? (
        <>
          <p className="mb-6 text-sm text-muted-foreground" aria-live="polite">
            {isPending ? (
              'Updating platinums…'
            ) : isLoadingMore ? (
              'Loading more platinums…'
            ) : (
              <>
                Showing{' '}
                <span className="tabular font-semibold text-foreground">
                  {items.length}
                </span>{' '}
                of <span className="tabular">{total}</span> platinum
                {total === 1 ? '' : 's'}
              </>
            )}
          </p>
          {view === 'grid' ? (
            <div
              data-gallery-view="grid"
              className={cn(
                'gap-6',
                galleryColumnsClass(total),
                `transition-opacity ${isPending ? 'opacity-60' : ''}`,
              )}
            >
              {items.map((platinum, index) => (
                <div key={platinum.id} className="mb-6 break-inside-avoid">
                  <PlatinumCard
                    platinum={platinum}
                    user={user}
                    showComment={isOwner}
                    canDelete={isOwner}
                    canEdit={isOwner}
                    layout="grid"
                    priority={index < 4}
                  />
                </div>
              ))}
              {isLoadingMore && (
                <>
                  <GhostCard />
                  <GhostCard />
                  <GhostCard />
                  <GhostCard />
                </>
              )}
            </div>
          ) : (
            <div
              data-gallery-view="list"
              className={cn('space-y-4', isPending && 'opacity-60')}
            >
              {items.map((platinum, index) => (
                <PlatinumCard
                  key={platinum.id}
                  platinum={platinum}
                  user={user}
                  showComment={isOwner}
                  canDelete={isOwner}
                  canEdit={isOwner}
                  layout="list"
                  priority={index < 4}
                />
              ))}
              {isLoadingMore && (
                <>
                  <ListGhostCard />
                  <ListGhostCard />
                </>
              )}
            </div>
          )}

          {hasMore && (
            <>
              <div ref={sentinelRef} aria-hidden className="h-px" />
              <div className="mt-12 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore || isPending}
                >
                  {isLoadingMore && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoadingMore ? 'Loading...' : 'Load more platinums'}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <EmptyState
          icon={hasFilters ? SearchX : Trophy}
          title={hasFilters ? 'No platinums found' : 'No platinums yet'}
description={
                hasFilters
                  ? 'No platinums match these filters. Try another platform or sort order.'
                  : "This trophy hunter hasn't shared any platinum screenshots yet."
              }
          {...(hasFilters
            ? { actionLabel: 'Clear filters', onAction: handleClearFilters }
            : { actionLabel: 'Upload a platinum', actionHref: '/upload' })}
        />
      )}
    </div>
  );
}
