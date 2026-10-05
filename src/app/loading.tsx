import { Skeleton } from '@/components/ui/skeleton';

// Neutral shell for document and marketing routes (about, faq, pricing, legal,
// upload) that inherit the root loading state. The gallery routes keep their
// own card-grid skeletons.
export default function Loading() {
  return (
    <div className="container py-10 md:py-16">
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto h-10 w-3/4" />
        <Skeleton className="mx-auto h-5 w-2/3" />
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
