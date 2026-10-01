import { Skeleton } from '@/components/ui/skeleton';

export default function PlatinumDetailLoading() {
  return (
    <div className="container py-8 md:py-12">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
        <div className="min-w-0 md:col-span-3">
          <Skeleton className="aspect-video w-full rounded-xl" />
        </div>
        <div className="min-w-0 md:col-span-2">
          <div className="panel-solid space-y-6 rounded-2xl p-6">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
