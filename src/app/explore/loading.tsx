import { Skeleton } from '@/components/ui/skeleton';
import { PlatinumCardSkeleton } from '@/components/shared/platinum-card-skeleton';
import { Card } from '@/components/ui/card';

export default function ExploreLoading() {
  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-8">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-5 w-2/3 mx-auto mt-3" />
      </div>

      <Card className="p-4 mb-12">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <Skeleton className="h-10 flex-1 min-w-[180px]" />
          <Skeleton className="h-10 flex-1 min-w-[180px]" />
          <Skeleton className="h-10 flex-1 min-w-[180px]" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <PlatinumCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}