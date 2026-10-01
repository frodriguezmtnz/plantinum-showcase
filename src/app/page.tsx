import Image from 'next/image';
import {
  getHallOfFame,
  getLatestPlatinums,
  getUsersByIds,
  getMonthlyRaceStats,
} from '@/lib/data';
import { auth } from '@/auth';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { RaceRow, type RaceEntry } from '@/components/shared/race-row';
import { HomeMotion } from '@/components/shared/home-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Camera, Crown, Upload, Vote } from 'lucide-react';
import { getRaceState } from '@/lib/race';
import { getLatestClosedRanking } from '@/lib/history';
import { formatPeriodLabel } from '@/lib/period';
import { isStoredImage } from '@/lib/utils';

function closeCopy(daysLeft: number): string {
  if (daysLeft <= 0) return 'polls close today';
  if (daysLeft === 1) return 'polls close tomorrow';
  return `polls close in ${daysLeft} days`;
}

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [raceBoardRaw, latestPlatinumsData, stats] = await Promise.all([
    getHallOfFame(12, currentUserId),
    getLatestPlatinums(12, currentUserId),
    getMonthlyRaceStats(),
  ]);

  const race = getRaceState();
  const latestPlatinums = latestPlatinumsData;
  const users = await getUsersByIds([
    ...raceBoardRaw.map((p) => p.userId),
    ...latestPlatinums.map((p) => p.userId),
  ]);
  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  // The live home row is a showcase, not a tease: a spoiler-protected plate of
  // the current race stays in the gallery (with its Reveal button) and never
  // occupies the row. Ranks keep their true standing — if #1 hides a spoiler,
  // the first tile on the row is honestly #3. (A closed month, below, is shown
  // as it finished instead.)
  const raceBoard = raceBoardRaw
    .map((p, i) => ({ p, rank: i + 1 }))
    .filter(({ p }) => !p.isSpoiler)
    .slice(0, 8);

  const currentEntries: RaceEntry[] = raceBoard.map(({ p, rank }) => ({
    id: p.id,
    gameName: p.gameName,
    imageUrl: p.imageUrl,
    width: p.width,
    height: p.height,
    platform: p.platform,
    username: getUserById(p.userId)?.username ?? 'a hunter',
    monthlyVotes: p.monthlyVotes,
    isSpoiler: p.isSpoiler,
    rank,
  }));

  // A fresh month opens with an empty board. Rather than leave the hero bare,
  // hand the row its most recent closed race — real votes, real standings —
  // labelled so nobody mistakes it for the current month. Spoiler-protected
  // plates are left out of the row entirely (a locked tile is a tease on a
  // browse screen), so ranks keep their true standing without hiding winners
  // behind a veil. We read a wider window and keep the best non-spoiler plates.
  let entries = currentEntries;
  let archivePeriod: string | null = null;
  if (currentEntries.length === 0) {
    const closed = await getLatestClosedRanking(24);
    const visible = closed?.entries.filter((entry) => !entry.isSpoiler).slice(0, 8) ?? [];
    if (closed && visible.length > 0) {
      archivePeriod = closed.period;
      entries = visible.map((entry) => ({
        id: entry.id,
        gameName: entry.gameName,
        imageUrl: entry.imageUrl,
        width: entry.width,
        height: entry.height,
        platform: entry.platform,
        username: entry.username,
        monthlyVotes: entry.votes,
        isSpoiler: entry.isSpoiler,
        rank: entry.rank,
      }));
    }
  }

  return (
    <HomeMotion>
    <div>
      {/* The browse screen itself: the field is the page, the race row is the hero. */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 pb-10 pt-24">
        <div className="absolute inset-x-0 top-4 flex justify-center px-4">
          <div className="hm-strip panel-solid flex max-w-full flex-wrap items-center justify-center gap-x-3 rounded-full px-5 py-2 text-center">
            <span className="field-mark">{race.monthLabel}</span>
            <span aria-hidden className="hidden text-border sm:inline">|</span>
            <span className="tabular text-sm font-semibold">
              {stats.plates} plates on the board · <span className="hm-count" data-count={stats.votes}>{stats.votes.toLocaleString('en-US')}</span> votes cast
            </span>
            <span aria-hidden className="hidden text-border sm:inline">|</span>
            <span className="text-sm font-semibold text-live">{closeCopy(race.daysLeft)}</span>
          </div>
        </div>

        <div className="px-6 text-center">
          <h1 className="font-headline overflow-hidden pb-[0.12em] text-4xl font-light leading-[1.08] tracking-tight text-balance text-foreground md:text-6xl">
            <span className="hm-title block">Show your platinum to the world.</span>
          </h1>
          <p className="hm-sub mx-auto mt-4 max-w-xl text-base font-semibold text-secondary-foreground/80 md:text-lg">
            The community gallery for PlayStation platinums. One vote each, every month
            — the board resets when the clocks roll over.
          </p>
        </div>

        {entries.length === 0 && (
          <p className="text-sm font-semibold text-primary">
            The board is empty — be the first plate of {race.monthLabel}.
          </p>
        )}
        <div className="hm-row w-full">
          <RaceRow
            entries={entries}
            contextLabel={
              archivePeriod
                ? `No votes in ${race.monthLabel} yet — showing how ${formatPeriodLabel(archivePeriod)} closed.`
                : undefined
            }
          />
        </div>

        <p className="hm-hint field-mark hidden sm:block">
          Arrows or scroll to browse · Enter opens the plate
        </p>
      </section>

      {/* The dealt hand: four sticky cards stacking one on top of the next. */}
      <section className="container pb-24">
        <div className="stack-deck">
          {/* 01 — what this is */}
          <div className="stack-card p-6 md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
                  What is Platinum Showcase?
                </h2>
                <p className="mt-3 max-w-md text-muted-foreground">
                  A community gallery where PlayStation hunters post the
                  screenshot of a hard-won platinum — and the board settles
                  who wore it best.
                </p>
                <ul className="mt-6 grid gap-4">
                  <li className="flex items-start gap-3">
                    <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                    <span><span className="font-bold">Post your plate.</span> Upload the screenshot, name the game, mark the platform.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Vote className="mt-0.5 h-5 w-5 shrink-0 text-live" aria-hidden />
                    <span><span className="font-bold">The community votes.</span> One vote each, every month — no accounts for sale.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 shrink-0 text-dusk" aria-hidden />
                    <span><span className="font-bold">One crown a month.</span> The podium is real ranking; the board resets when the clocks roll over.</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
                <Crown className="h-8 w-8 shrink-0 text-dusk" aria-hidden />
                <div className="min-w-0">
                  <p className="font-headline text-base font-bold">
                    {stats.plates} plates · {stats.votes.toLocaleString('en-US')} votes this month
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {closeCopy(race.daysLeft)} — {race.monthLabel}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
                  <Link href="/explore">Browse</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 02 — this month's podium (real top 3, spoiler-safe) */}
          {entries.length >= 3 && (
            <div className="stack-card p-6 md:p-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
                  {archivePeriod ? "Last month's podium" : "This month's podium"}
                </h2>
                <Button asChild variant="outline" size="sm">
                  {archivePeriod ? (
                    <Link href="/explore">Open the full gallery</Link>
                  ) : (
                    <Link href="/hall-of-fame">Full hall of fame</Link>
                  )}
                </Button>
              </div>
              <ol className="mt-6 grid grid-cols-1 gap-3">
                {entries.slice(0, 3).map((entry) => (
                  <li key={entry.id} className="min-w-0">
                    <Link
                      href={`/platinum/${entry.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-shadow hover:shadow-bloom focus-visible:shadow-bloom sm:gap-4"
                    >
                      <span className="tabular w-6 shrink-0 text-center text-base font-extrabold text-primary sm:w-10 sm:text-lg">
                        #{entry.rank}
                      </span>
                      <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/70 sm:w-24">
                        <Image
                          src={entry.imageUrl}
                          alt={`Platinum screenshot for ${entry.gameName}`}
                          fill
                          sizes="(min-width: 640px) 96px, 64px"
                          className="object-cover"
                          unoptimized={isStoredImage(entry.imageUrl)}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{entry.gameName}</span>
                        <span className="block truncate text-xs text-muted-foreground">@{entry.username} · {entry.platform}</span>
                      </span>
                      <span className="tabular shrink-0 text-xs font-bold text-live sm:text-sm">
                        {entry.monthlyVotes} votes
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 03 — latest plates (tall: fades into its capped edge, gallery holds the rest) */}
          <div id="latest" className="stack-card relative scroll-mt-24 p-6 md:p-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
                Latest platinums
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href="/explore">Open the full gallery</Link>
              </Button>
            </div>
            {latestPlatinums.length > 0 ? (
              <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
                {latestPlatinums.map((platinum) => (
                  <div key={platinum.id} className="mb-6 break-inside-avoid">
                    <PlatinumCard
                      platinum={platinum}
                      user={getUserById(platinum.userId)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-8 text-muted-foreground">
                No plates on the shelves yet. Yours could open the show.
              </p>
            )}
            <div aria-hidden className="stack-fade" />
          </div>

          {/* 04 — CTA */}
          <div id="cta" className="stack-card scroll-mt-24 px-6 py-16 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-balance md:text-4xl">
              Your platinum belongs on this row.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Post the screenshot, let the community vote it up, and take the month.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link href="/upload">
                <Upload className="h-4 w-4" />
                Submit a plate
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
    </HomeMotion>
  );
}
