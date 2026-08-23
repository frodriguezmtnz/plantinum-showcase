import { Skeleton } from '@/components/ui/skeleton';

export default function HallOfFameLoading() {
  return (
    <section className="container py-8 md:py-12">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-5 w-1/4 mx-auto mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center">
            <Skeleton className="w-full aspect-[3/4] rounded-lg mb-4" />
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-4 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}