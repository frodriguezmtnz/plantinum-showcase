import { getPlatinumsPage } from '@/lib/data';
import { ExploreClient } from '@/components/explore/explore-client';

export const metadata = {
  title: 'Explorar Galería | Platinum Showcase',
};

type Props = {
  searchParams: Promise<{ q?: string; platform?: string; sort?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q = '', platform = 'all', sort = 'recent' } = await searchParams;

  const { items, hasMore } = await getPlatinumsPage({ q, platform, sort });

  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-headline">Explorar Galería</h1>
        <p className="mt-3 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Navega por todas las capturas de platino subidas por la comunidad. Usa los filtros para encontrar exactamente lo que buscas.
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
