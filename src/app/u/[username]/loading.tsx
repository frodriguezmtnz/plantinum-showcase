import { Skeleton } from '@/components/ui/skeleton';
import { PlatinumCardSkeleton } from '@/components/shared/platinum-card-skeleton';

export default function UserProfileLoading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="flex flex-col items-center text-center mb-12">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto mb-16">
        <Skeleton className="h-8 w-64 mx-auto mb-6" />
        <PlatinumCardSkeleton variant="top" />
      </div>

      <div>
        <Skeleton className="h-8 w-48 mx-auto mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 4 }).map((_, index) => (
            <PlatinumCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}