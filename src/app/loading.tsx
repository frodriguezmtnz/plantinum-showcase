import { PlatinumCardSkeleton } from '@/components/shared/platinum-card-skeleton';

export default function Loading() {
  return (
    <div className="container py-8 md:py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <PlatinumCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}