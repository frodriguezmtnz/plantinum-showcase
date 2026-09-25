'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center py-16">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        An unexpected error occurred. Try reloading the page, or give it another go in a moment.
      </p>
      <Button onClick={reset} size="lg" className="mt-8">
        Try again
      </Button>
    </div>
  );
}
