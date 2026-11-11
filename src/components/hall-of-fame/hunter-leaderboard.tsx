import Link from 'next/link';
import { Trophy, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import type {
  HunterLeaderboardEntry,
  HunterStanding,
} from '@/lib/hunter-rankings';

interface HunterLeaderboardProps {
  items: HunterLeaderboardEntry[];
  total: number;
  standing: HunterStanding | null;
  scope: 'global' | 'circle';
  isSignedIn: boolean;
  /** "november 2026" — already lower-cased by the page. */
  periodLabel: string;
}

const PODIUM_STYLES: Record<
  1 | 2 | 3,
  {
    ring: string;
    bg: string;
    text: string;
    label: string;
    order: string;
    lift: string;
    shine: string;
    hoverRing: string;
  }
> = {
  1: {
    ring: 'ring-2 ring-dusk-bright/65',
    bg: 'bg-[hsl(44_92%_90%/0.8)]',
    text: 'text-[hsl(30_72%_32%)]',
    label: 'Champion',
    order: 'md:order-2',
    lift: 'md:-translate-y-8',
    shine: 'hsl(44 92% 72% / 0.7)',
    hoverRing: 'hover:ring-dusk-bright',
  },
  2: {
    ring: 'ring-1 ring-[hsl(211_30%_55%/0.5)]',
    bg: 'bg-[hsl(206_45%_94%/0.85)]',
    text: 'text-[hsl(211_45%_32%)]',
    label: '2nd Place',
    order: 'md:order-1',
    lift: 'md:-translate-y-4',
    shine: 'hsl(206 55% 82% / 0.65)',
    hoverRing: 'hover:ring-[hsl(211_50%_62%/0.9)]',
  },
  3: {
    ring: 'ring-1 ring-[hsl(24_55%_45%/0.5)]',
    bg: 'bg-[hsl(28_65%_93%/0.85)]',
    text: 'text-[hsl(24_60%_34%)]',
    label: '3rd Place',
    order: 'md:order-3',
    lift: '',
    shine: 'hsl(28 70% 72% / 0.65)',
    hoverRing: 'hover:ring-[hsl(28_65%_55%/0.9)]',
  },
};

function platinumsLabel(count: number): string {
  return count === 1 ? '1 platinum' : `${count} platinums`;
}

function StandingBanner({
  standing,
  scope,
  isSignedIn,
  periodLabel,
}: {
  standing: HunterStanding | null;
  scope: 'global' | 'circle';
  isSignedIn: boolean;
  periodLabel: string;
}) {
  if (!isSignedIn) {
    return (
      <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
        <Link
          href="/login?callbackUrl=/hall-of-fame%3Fboard%3Dhunters"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>{' '}
        to see where you stand in {periodLabel}.
      </div>
    );
  }

  if (!standing) {
    return (
      <div className="mx-auto mb-10 max-w-3xl rounded-2xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
        You have no monthly votes yet. Vote on plates or upload your own to
        enter the hunter board for {periodLabel}.
      </div>
    );
  }

  return (
    <div className="mx-auto mb-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-2xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
      <span className="field-mark">
        {scope === 'circle' ? 'Your global standing' : 'Your standing'}
      </span>
      <span className="tabular text-lg font-bold text-foreground">
        #{standing.rank}
      </span>
      <span className="text-muted-foreground">
        of {standing.total} {standing.total === 1 ? 'hunter' : 'hunters'}
      </span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span className="tabular font-semibold text-live">
        {standing.monthlyVotes} monthly{' '}
        {standing.monthlyVotes === 1 ? 'vote' : 'votes'}
      </span>
    </div>
  );
}

/** Monthly hunter standings: podium of three plus a ranked list below. */
export function HunterLeaderboard({
  items,
  total,
  standing,
  scope,
  isSignedIn,
  periodLabel,
}: HunterLeaderboardProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={scope === 'circle' ? Users : Trophy}
        title={
          scope === 'circle'
            ? 'No votes in your circle yet.'
            : 'The hunter board is empty this month.'
        }
        description={
          scope === 'circle'
            ? 'Follow trophy hunters to build your circle, or vote on the freshest platinums so your favorites climb the board.'
            : 'Vote on the freshest platinums or upload your own — the first hunter of the month is still undecided.'
        }
        actionLabel={scope === 'circle' ? 'Explore and follow hunters' : 'Explore the gallery'}
        actionHref="/explore"
      />
    );
  }

  const podium = items.filter((item) => item.rank <= 3);
  const rest = items.filter((item) => item.rank > 3);

  return (
    <div>
      <StandingBanner
        standing={standing}
        scope={scope}
        isSignedIn={isSignedIn}
        periodLabel={periodLabel}
      />

      <div className="mx-auto mb-6 grid max-w-5xl grid-cols-1 items-end gap-6 pb-4 pt-8 md:grid-cols-3">
        {podium.map((item) => {
          const style = PODIUM_STYLES[item.rank as 1 | 2 | 3];
          return (
            <Link
              key={item.userId}
              href={`/u/${item.username}`}
              style={{ ['--shine' as string]: style.shine }}
              className={cn(
                'group relative flex flex-col items-center overflow-hidden rounded-2xl px-5 py-6 text-center outline-none transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_28px_-6px_var(--shine)] focus-visible:shadow-bloom',
                style.ring,
                style.hoverRing,
                style.bg,
                style.order,
                style.lift,
              )}
            >
              <span className="podium-shine" aria-hidden />
              <span className={cn('field-mark', style.text)}>{style.label}</span>
              <Avatar className="mt-3 h-16 w-16 border-2 border-background/60">
                <AvatarImage src={item.avatarUrl} alt={item.username} />
                <AvatarFallback>
                  {item.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 w-full truncate font-headline text-lg font-bold">
                @{item.username}
              </h3>
              <p className="text-xs text-muted-foreground">
                {platinumsLabel(item.plates)}
              </p>
              <p
                className={cn(
                  'mt-2 flex items-center gap-1.5 font-bold tabular',
                  style.text,
                )}
              >
                {item.monthlyVotes}
                <Trophy className="h-4 w-4" aria-hidden />
                <span className="sr-only">monthly votes</span>
              </p>
            </Link>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center font-headline text-2xl font-bold">
            Rest of the board
          </h2>
          <ul className="space-y-3">
            {rest.map((item) => (
              <li key={item.userId}>
                <Link
                  href={`/u/${item.username}`}
                  className="block rounded-xl outline-none transition-shadow duration-300 focus-visible:shadow-bloom"
                >
                  <Card className="panel-solid flex items-center gap-4 rounded-xl p-3 transition duration-300 hover:shadow-glow sm:p-4">
                    <div className="w-10 shrink-0 text-center text-xl font-bold tabular text-muted-foreground">
                      #{item.rank}
                    </div>
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={item.avatarUrl} alt={item.username} />
                      <AvatarFallback>
                        {item.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">
                        @{item.username}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {platinumsLabel(item.plates)} this month
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold tabular text-live">
                        <span>{item.monthlyVotes}</span>
                        <Trophy className="h-4 w-4" aria-hidden />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        monthly votes
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Showing {items.length} of {total}{' '}
        {total === 1 ? 'hunter' : 'hunters'} with votes in {periodLabel}.
      </p>
    </div>
  );
}
