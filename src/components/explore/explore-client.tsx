'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { PlatinumCard } from '@/components/shared/platinum-card';
import type { PlatinumPageItem } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { Loader2, SearchX } from 'lucide-react';
import { getMorePlatinums } from '@/app/actions';

interface ExploreClientProps {
  initialItems: PlatinumPageItem[];
  initialHasMore: boolean;
  q: string;
  platform: string;
  sort: string;
}

export function ExploreClient({ initialItems, initialHasMore, q, platform, sort }: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState(q);
  const [platformFilter, setPlatformFilter] = useState(platform);
  const [sortOrder, setSortOrder] = useState(sort);

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
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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

  async function handleLoadMore() {
    setIsLoadingMore(true);
    try {
      const result = await getMorePlatinums({
        q,
        platform,
        sort,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...result.items]);
      setHasMore(result.hasMore);
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
      if (hasMore && !isLoadingMore) handleLoadMore();
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
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-sm font-medium sr-only sm:not-sr-only whitespace-nowrap">Game:</label>
            <Input
              type="text"
              placeholder="Search by game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[180px]">
            <label className="text-sm font-medium sr-only sm:not-sr-only whitespace-nowrap">Platform:</label>
            <Select value={platformFilter} onValueChange={handlePlatformChange}>
              <SelectTrigger className="w-full">
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
            <label className="text-sm font-medium sr-only sm:not-sr-only whitespace-nowrap shrink-0">Sort by:</label>
            <Select value={sortOrder} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
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

      {items.length > 0 ? (
        <>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
            {items.map((item) => (
              <div key={item.platinum.id} className="mb-6 break-inside-avoid">
                <PlatinumCard
                  platinum={item.platinum}
                  user={item.user}
                />
              </div>
            ))}
          </div>

          {hasMore && (
            <>
              <div ref={sentinelRef} aria-hidden className="h-px" />
              <div className="mt-12 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
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
          description="Try tweaking the filters, or come back later."
          actionLabel="Upload a platinum"
          actionHref="/upload"
        />
      )}
    </div>
  );
}
