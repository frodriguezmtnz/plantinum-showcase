import Link from 'next/link';
import { CalendarDays, ExternalLink, Gamepad2, Pencil } from 'lucide-react';

interface ProfileAboutProps {
  username: string;
  bio: string | null;
  psnProfileUrl: string | null;
  createdAt: string;
  isOwner: boolean;
}

function joinedLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function ProfileAbout({
  username,
  bio,
  psnProfileUrl,
  createdAt,
  isOwner,
}: ProfileAboutProps) {
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div className="panel-solid rounded-2xl p-6 md:p-8">
        <h2 className="field-mark">About @{username}</h2>

        {bio ? (
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed">
            {bio}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {isOwner ? (
              <>
                No bio yet.{' '}
                <Link
                  href="/settings"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Add one in Settings
                </Link>
                .
              </>
            ) : (
              'This hunter has not written a bio yet.'
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Member since {joinedLabel(createdAt)}
          </span>

          {psnProfileUrl && (
            <a
              href={psnProfileUrl}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-semibold text-foreground transition-colors hover:bg-popover"
            >
              <Gamepad2 className="h-4 w-4" aria-hidden />
              PlayStation profile
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}

          {!psnProfileUrl && isOwner && (
            <Link
              href="/settings"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Add your PlayStation profile
            </Link>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="flex justify-center">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit profile
          </Link>
        </div>
      )}
    </section>
  );
}
