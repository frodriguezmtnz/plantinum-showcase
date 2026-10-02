import Image from 'next/image';
import {
  getLatestPlatinums,
  getMostVotedPlatinums,
  getUsersByIds,
  getCommunityStats,
} from '@/lib/data';
import { auth } from '@/auth';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { RaceRow, type RaceEntry } from '@/components/shared/race-row';
import { HomeMotion } from '@/components/shared/home-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Camera, Crown, Sparkles, Trophy, Vote } from 'lucide-react';
import { PlatinumMarkIcon } from '@/components/icons/platinum-mark-icon';
import { isStoredImage } from '@/lib/utils';

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [favourites, latestPlatinumsData, stats] = await Promise.all([
    getMostVotedPlatinums(8, [], currentUserId),
    getLatestPlatinums(12, currentUserId),
    getCommunityStats(),
  ]);

  const latestPlatinums = latestPlatinumsData;
  const users = await getUsersByIds([
    ...favourites.map((p) => p.userId),
    ...latestPlatinums.map((p) => p.userId),
  ]);
  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  // The home is an evergreen showcase, not a scoreboard: the row drifts through
  // the community's all-time most-voted plates (spoiler-free) so it never reads
  // as an empty shelf and never names a month. The live monthly race lives in
  // Explore. Chips show real all-time votes instead of a month rank.
  const entries: RaceEntry[] = favourites.map((p) => ({
    id: p.id,
    gameName: p.gameName,
    imageUrl: p.imageUrl,
    width: p.width,
    height: p.height,
    platform: p.platform,
    username: getUserById(p.userId)?.username ?? 'a hunter',
    monthlyVotes: p.votes,
    isSpoiler: p.isSpoiler,
    rank: 0,
    fallback: true,
  }));

  const mostLoved = favourites.slice(0, 3);

  return (
    <HomeMotion>
    <div>
      {/* The browse screen itself: the field is the page, the race row is the hero. */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 pb-10 pt-24">
        <div className="absolute inset-x-0 top-4 flex justify-center px-4">
          <div className="hm-strip panel-solid flex max-w-full flex-wrap items-center justify-center gap-x-3 rounded-full px-5 py-2 text-center">
            <span className="field-mark">Community</span>
            <span aria-hidden className="hidden text-border sm:inline">|</span>
            <span className="tabular text-sm font-semibold">
              {stats.platinums.toLocaleString('en-US')} plates ·{' '}
              <span className="hm-count" data-count={stats.votes}>{stats.votes.toLocaleString('en-US')}</span> votes
            </span>
            <span aria-hidden className="hidden text-border sm:inline">|</span>
            <span className="text-sm font-semibold text-live">
              {stats.hunters.toLocaleString('en-US')} hunters
            </span>
          </div>
        </div>

        <div className="px-6 text-center">
          <h1 className="font-headline overflow-hidden pb-[0.12em] text-4xl font-light leading-[1.08] tracking-tight text-balance text-foreground md:text-6xl">
            <span className="hm-title block">Show your platinum to the world.</span>
          </h1>
          <p className="hm-sub mx-auto mt-4 max-w-xl text-base font-semibold text-secondary-foreground/80 md:text-lg">
            The community gallery for PlayStation platinums. Post the screenshot of a
            hard-won platinum and let the hunters vote it up.
          </p>
        </div>

        {entries.length === 0 && (
          <p className="text-sm font-semibold text-primary">
            No plates yet — be the first to show one.
          </p>
        )}
        <div className="hm-row w-full">
          <RaceRow entries={entries} />
        </div>

        <p className="hm-hint field-mark hidden sm:block">
          Arrows or scroll to browse · Enter opens the plate
        </p>
      </section>

      {/* The dealt hand: the two explainer cards stacking one on the next. */}
      <section className="container pb-8">
        <div className="stack-deck">
          {/* 01 — what this is */}
          <div className="stack-card p-6 md:p-10">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div className="min-w-0">
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
                    <span><span className="font-bold">The community votes.</span> One vote each — no accounts for sale.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Crown className="mt-0.5 h-5 w-5 shrink-0 text-dusk" aria-hidden />
                    <span><span className="font-bold">A favourite emerges.</span> The votes settle who wore it best.</span>
                  </li>
                </ul>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4">
                <Crown className="h-8 w-8 shrink-0 text-dusk" aria-hidden />
                <div className="min-w-0">
                  <p className="font-headline text-base font-bold">
                    {stats.platinums.toLocaleString('en-US')} plates · {stats.votes.toLocaleString('en-US')} votes · {stats.hunters.toLocaleString('en-US')} hunters
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    Every plate is a hard-won trophy.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="ml-auto shrink-0">
                  <Link href="/explore">Browse</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* 02 — the community's all-time most-loved plates (evergreen) */}
          {mostLoved.length >= 3 && (
            <div className="stack-card p-6 md:p-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
                  Most loved plates
                </h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/explore">Open the full gallery</Link>
                </Button>
              </div>
              <ol className="mt-6 grid grid-cols-1 gap-3">
                {mostLoved.map((platinum, i) => (
                  <li key={platinum.id} className="min-w-0">
                    <Link
                      href={`/platinum/${platinum.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 transition-shadow hover:shadow-bloom focus-visible:shadow-bloom sm:gap-4"
                    >
                      <span className="tabular w-6 shrink-0 text-center text-base font-extrabold text-primary sm:w-10 sm:text-lg">
                        #{i + 1}
                      </span>
                      <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-white/70 sm:w-24">
                        <Image
                          src={platinum.imageUrl}
                          alt={`Platinum screenshot for ${platinum.gameName}`}
                          fill
                          sizes="(min-width: 640px) 96px, 64px"
                          className="object-cover"
                          unoptimized={isStoredImage(platinum.imageUrl)}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{platinum.gameName}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          @{getUserById(platinum.userId)?.username ?? 'a hunter'} · {platinum.platform}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-xs font-bold text-live sm:text-sm">
                        {platinum.votes} votes
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

        </div>
      </section>

      {/* 03 — latest plates: a balanced dozen, a plain section so the sticky deck never covers it */}
      <section id="latest" className="container scroll-mt-24 pb-16 md:pb-20">
        <h2 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
          Latest platinums
        </h2>
        {latestPlatinums.length > 0 ? (
          <>
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
            <div className="mt-10 flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/explore">See more in Gallery</Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-8 text-muted-foreground">
            No plates on the shelves yet. Yours could open the show.
          </p>
        )}
      </section>

      {/* 04 — CTA: the brand cup carries the panel, the copy and the button answer it */}
      <section id="cta" className="container scroll-mt-24 pb-24">
        <div className="panel-solid rounded-2xl p-6 md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,240px)_1fr]">
            <div className="relative mx-auto flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
              <span className="absolute inset-0 rounded-full bg-primary/5 blur-2xl" aria-hidden />
              <PlatinumMarkIcon className="cta-trophy relative h-36 w-36 sm:h-44 sm:w-44" />
              <Sparkles className="cta-spark absolute right-1 top-1 h-6 w-6 text-dusk" aria-hidden />
              <Sparkles className="cta-spark cta-spark--late absolute bottom-2 left-0 h-4 w-4 text-live" aria-hidden />
            </div>
            <div className="text-center md:text-left">
              <h2 className="font-headline text-3xl font-bold tracking-tight text-balance md:text-4xl">
                Your platinum belongs on this row.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground md:mx-0">
                Post the screenshot, let the community vote it up, and let it take the crown.
              </p>
              <Button asChild size="lg" className="group mt-7">
                <Link href="/upload">
                  <span className="cta-trophy-icon inline-flex">
                    <Trophy className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125" />
                  </span>
                  Submit a platinum
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
    </HomeMotion>
  );
}
