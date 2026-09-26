import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center py-16">
      <Trophy className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-6xl md:text-7xl font-bold font-headline text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page not found</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        This trophy doesn't exist or has been removed. Head back to the start and keep exploring.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
