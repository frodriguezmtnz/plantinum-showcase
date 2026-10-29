import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Check, Circle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const steps = [
    { label: 'Avatar', done: hasAvatar },
    { label: 'Bio', done: Boolean(bio?.trim()) },
    { label: 'PSN profile', done: links.length > 0 },
  ];
  const missing = steps.filter((step) => !step.done).length;

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      {isOwner && missing > 0 && (
        <div className="panel-solid rounded-2xl border border-dashed border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="field-mark">Complete your profile</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {steps.length - missing} of {steps.length} done — the rest takes
                a minute.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/settings#profile">Finish in Settings</Link>
            </Button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {steps.map((step) => (
              <li
                key={step.label}
                className="inline-flex items-center gap-1.5"
              >
                {step.done ? (
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                ) : (
                  <Circle
                    className="h-4 w-4 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
                <span className={step.done ? '' : 'font-semibold'}>
                  {step.label}
                </span>
                <span className="sr-only">
                  {step.done ? '(done)' : '(pending)'}
                </span>
              </li>
            ))}
          </ul>
        </div>
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
              : 'This hunter has not written a bio yet.'}
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
        </div>
      </div>
    </section>
  );
}
