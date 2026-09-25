import { getPlatinumsPage } from '@/lib/data';
import { auth } from '@/auth';
import { ExploreClient } from '@/components/explore/explore-client';

export const metadata = {
  title: 'Explore Gallery | Platinum Showcase',
};

type Props = {
  searchParams: Promise<{ q?: string; platform?: string; sort?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q = '', platform = 'all', sort = 'recent' } = await searchParams;
  const session = await auth();

  const { items, hasMore } = await getPlatinumsPage({
    q,
    platform,
    sort,
    currentUserId: session?.user?.id,
  });

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-headline text-balance">Explore the Gallery</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Browse every platinum screenshot shared by the community. Use the filters to find exactly what
          you&apos;re looking for.
        </p>
      </div>

      <ExploreClient
        key={`${q}|${platform}|${sort}`}
        initialItems={items}
        initialHasMore={hasMore}
        q={q}
        platform={platform}
        sort={sort}
      />
    </section>
  );
}
