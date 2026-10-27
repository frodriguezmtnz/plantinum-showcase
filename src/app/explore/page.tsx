import { redirect } from 'next/navigation';
import { getFollowingFeedPage, getPlatinumsPage } from '@/lib/data';
import { auth } from '@/auth';
import { ExploreClient } from '@/components/explore/explore-client';
import { MonthlyRace } from '@/components/explore/monthly-race';

export const metadata = {
  title: 'Explore Gallery | Platinum Showcase',
  alternates: { canonical: '/explore' },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    platform?: string;
    sort?: string;
    source?: string;
  }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const {
    q = '',
    platform = 'all',
    sort = 'recent',
    source: rawSource,
  } = await searchParams;
  const source = rawSource === 'following' ? 'following' : 'all';
  const session = await auth();
  const userId = session?.user?.id;

  // The follow feed is per-account; send anonymous visitors to sign in first.
  if (source === 'following' && !userId) {
    redirect('/login?callbackUrl=/explore%3Fsource%3Dfollowing');
  }

  const { items, hasMore } =
    source === 'following'
      ? await getFollowingFeedPage({
          q,
          platform,
          sort,
          followerId: userId!,
          currentUserId: userId,
        })
      : await getPlatinumsPage({
          q,
          platform,
          sort,
          currentUserId: userId,
        });

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-balance">Explore the Gallery</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-3xl mx-auto">
          Browse every platinum screenshot shared by the community. Use the filters to find exactly what
          you&apos;re looking for.
        </p>
      </div>

      <div className="mb-8">
        <MonthlyRace />
      </div>

      <ExploreClient
        initialItems={items}
        initialHasMore={hasMore}
        q={q}
        platform={platform}
        sort={sort}
        source={source}
        isSignedIn={Boolean(userId)}
      />
    </section>
  );
}
