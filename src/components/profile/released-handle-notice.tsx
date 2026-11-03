import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MovedHandleAnimation } from '@/components/profile/moved-handle-animation';

/**
 * Shown when a profile URL belongs to a released handle. We do not reveal the
 * new handle: a rename can be a deliberate way to drop old links.
 */
export function ReleasedHandleNotice({ username }: { username: string }) {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <MovedHandleAnimation />
      <p className="field-mark">Profile moved</p>
      <h1 className="mt-2 font-headline text-3xl font-bold tracking-tight md:text-4xl">
        This trophy hunter changed their handle
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The user{' '}
        <strong className="font-semibold text-foreground">
          &quot;{username}&quot;
        </strong>{' '}
        is no longer in use. Ask them for their current profile link, or keep
        exploring other hunters and platinums.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/explore">Explore platinums</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/hall-of-fame">Hall of Fame</Link>
        </Button>
      </div>
    </div>
  );
}
