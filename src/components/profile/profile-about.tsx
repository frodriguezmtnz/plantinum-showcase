import Image from 'next/image';
import { CalendarDays, ExternalLink, Gamepad2 } from 'lucide-react';
import { ProfileCompletion } from '@/components/shared/profile-completion';
import { PSN_PROVIDERS } from '@/lib/psn';
import type { ProfileLinkView } from '@/lib/profile-links';

interface ProfileAboutProps {
  username: string;
  bio: string | null;
  links: ProfileLinkView[];
  createdAt: string;
  isOwner: boolean;
  hasAvatar: boolean;
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
  hasAvatar,
}: ProfileAboutProps) {
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      {isOwner && (
        <ProfileCompletion
          hasAvatar={hasAvatar}
          hasBio={Boolean(bio?.trim())}
          hasLinks={links.length > 0}
          showCta
        />
      )}

      <div className="panel-solid rounded-2xl p-6 md:p-8">
        <h2 className="field-mark">About @{username}</h2>

        {bio ? (
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed">
            {bio}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {isOwner
              ? 'No bio yet.'
              : 'This trophy hunter has not written a bio yet.'}
          </p>
        )}

        <div className="mt-6 border-t border-border/70 pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="field-mark">PlayStation profiles</h3>
            {links.length > 0 && (
              <span className="tabular text-xs text-muted-foreground">
                {links.length}
              </span>
            )}
          </div>

          {links.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {isOwner
                ? 'No profiles linked yet — add one from Settings.'
                : 'No profiles linked yet.'}
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {links.map((link) => {
                const provider = PSN_PROVIDERS.find(
                  (candidate) => candidate.value === link.provider,
                );
                const icon = provider?.icon;
                const name = provider?.label ?? link.label;

                return (
                  <li key={link.provider}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="group flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/40 px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-popover"
                    >
                      {icon ? (
                        <Image
                          src={icon}
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] shrink-0 rounded-[3px]"
                        />
                      ) : (
                        <Gamepad2
                          className="h-[18px] w-[18px] shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {link.handle}
                        </span>
                      </span>
                      <ExternalLink
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-hidden
                      />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Member since {joinedLabel(createdAt)}
        </p>
      </div>
    </section>
  );
}
