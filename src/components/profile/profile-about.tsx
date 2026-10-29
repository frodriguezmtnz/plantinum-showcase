import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { PSN_PROVIDERS } from '@/lib/psn';
import type { ProfileLinkView } from '@/lib/profile-links';

interface ProfileAboutProps {
  username: string;
  bio: string | null;
  links: ProfileLinkView[];
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
  links,
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

          {links.map((link) => {
            const icon = PSN_PROVIDERS.find(
              (provider) => provider.value === link.provider,
            )?.icon;
            return (
              <a
                key={link.provider}
                href={link.url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-semibold text-foreground transition-colors hover:bg-popover"
              >
                {icon && (
                  <Image
                    src={icon}
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 rounded-[3px]"
                  />
                )}
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            );
          })}

          {links.length === 0 && isOwner && (
            <Link
              href="/settings"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Add your PlayStation profile
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
