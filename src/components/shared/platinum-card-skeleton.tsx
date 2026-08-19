
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatinumCardSkeletonProps {
    variant?: 'default' | 'top';
}

export function PlatinumCardSkeleton({ variant = 'default' }: PlatinumCardSkeletonProps) {

    if (variant === 'top') {
        return <Skeleton className="aspect-[16/9] rounded-lg" />;
    }

    return (
        <Card className="flex flex-col overflow-hidden bg-card border-none">
            <CardContent className="p-0">
                <Skeleton className="aspect-[16/9] rounded-t-lg" />
            </CardContent>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-12" />
                </div>
                <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
        </Card>
    );
}
