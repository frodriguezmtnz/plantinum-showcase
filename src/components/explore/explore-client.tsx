'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PlatinumCard } from '@/components/shared/platinum-card';
import type { PlatinumPageItem } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/hooks/use-toast';
import { Loader2, SearchX, X } from 'lucide-react';
import { getMorePlatinums } from '@/app/actions';

interface ExploreClientProps {
  initialItems: PlatinumPageItem[];
  initialHasMore: boolean;
  q: string;
  platform: string;
  sort: string;
}

// Keep the old grid visible (dimmed) while the server navigation for new
// filters resolves, instead of flashing the route skeleton on every keystroke.
function GhostCard() {
  return (
    <div className="panel-solid mb-6 break-inside-avoid rounded-2xl p-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function ExploreClient({ initialItems, initialHasMore, q, platform, sort }: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState(q);
  const [platformFilter, setPlatformFilter] = useState(platform);
  const [sortOrder, setSortOrder] = useState(sort);

  // Sync server results into state only when they come from a navigation
  // (filter change); "load more" never touches the URL, so it keeps the list.
  const serverKey = `${q}|${platform}|${sort}`;
  const [syncedKey, setSyncedKey] = useState(serverKey);
  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey);
    setItems(initialItems);
    setHasMore(initialHasMore);
  }

  const updateUrl = useCallback(
    (next: { q?: string; platform?: string; sort?: string }) => {
      const nextQ = next.q ?? searchQuery;
      const nextPlatform = next.platform ?? platformFilter;
      const nextSort = next.sort ?? sortOrder;

      const params = new URLSearchParams();
      if (nextQ.trim()) params.set('q', nextQ.trim());
      if (nextPlatform && nextPlatform !== 'all') params.set('platform', nextPlatform);
      if (nextSort && nextSort !== 'recent') params.set('sort', nextSort);

      const query = params.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchQuery, platformFilter, sortOrder],
  );

  useEffect(() => {
    if (searchQuery === q) return;
    const handle = setTimeout(() => updateUrl({ q: searchQuery }), 350);
    return () => clearTimeout(handle);
  }, [searchQuery, q, updateUrl]);

  const handlePlatformChange = (value: string) => {
    setPlatformFilter(value);
    updateUrl({ platform: value });
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    updateUrl({ sort: value });
  };

  const hasFilters = q.trim() !== '' || platform !== 'all' || sort !== 'recent';

  const handleClearFilters = () => {
    setSearchQuery('');
    setPlatformFilter('all');
    setSortOrder('recent');
    updateUrl({ q: '', platform: 'all', sort: 'recent' });
  };

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const result = await getMorePlatinums({
        q: searchQuery,
        platform: platformFilter,
        sort: sortOrder,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
    } catch {
      toast({
        title: 'Could not load more',
        description: 'The next page failed to arrive. Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Infinite scroll: a sentinel near the bottom pulls the next page through
  // the same offset endpoint; the button stays as a keyboard/no-JS fallback.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = () => {
      if (hasMore && !isLoadingMore) void handleLoadMore();
    };
  });

  useEffect(() => {
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
  }, []);

  return (
    <div>
      <Card className="panel p-4 mb-12 rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <div className="flex flex-1 min-w-[180px] items-center gap-2">
            <label htmlFor="explore-q" className="text-sm font-medium whitespace-nowrap sr-only sm:not-sr-only">
              Game:
            </label>
            <div className="relative flex-1">
              <Input
                id="explore-q"
                type="search"
                placeholder="Search by game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={searchQuery ? 'w-full pr-9' : 'w-full'}
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label htmlFor="explore-platform" className="text-sm font-medium sr-only sm:not-sr-only whitespace-nowrap">
              Platform:
            </label>
            <Select value={platformFilter} onValueChange={handlePlatformChange}>
              <SelectTrigger id="explore-platform" className="w-full">
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PS5">PlayStation 5</SelectItem>
                <SelectItem value="PS4">PlayStation 4</SelectItem>
                <SelectItem value="PS3">PlayStation 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label
              htmlFor="explore-sort"
              className="text-sm font-medium sr-only sm:not-sr-only whitespace-nowrap shrink-0"
            >
              Sort by:
            </label>
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger id="explore-sort" className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="most-voted">Most voted</SelectItem>
                <SelectItem value="least-voted">Least voted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <p className="sr-only" aria-live="polite">
        {isPending
          ? 'Updating results…'
          : isLoadingMore
            ? 'Loading more plates…'
            : `Showing ${items.length} plate${items.length === 1 ? '' : 's'}${hasMore ? ', more available' : ''}.`}
      </p>

      {items.length > 0 ? (
        <>
          <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 transition-opacity ${isPending ? 'opacity-60' : ''}`}>
            {items.map((item) => (
              <div key={item.platinum.id} className="mb-6 break-inside-avoid">
                <PlatinumCard
                  platinum={item.platinum}
                  user={item.user}
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
                  {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No platinums found"
          description={
            hasFilters
              ? 'No plates match these filters. Widen the search — or be the one who uploads it.'
              : 'The board is empty right now. Be the first plate on it.'
          }
          {...(hasFilters
            ? { actionLabel: 'Clear filters', onAction: handleClearFilters }
            : { actionLabel: 'Upload a platinum', actionHref: '/upload' })}
        />
      )}
    </div>
  );
}
