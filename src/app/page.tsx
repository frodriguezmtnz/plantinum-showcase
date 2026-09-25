import {
  getHallOfFame,
  getLatestPlatinums,
  getUsers,
  getMonthlyRaceStats,
} from '@/lib/data';
import { auth } from '@/auth';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { RaceRow, type RaceEntry } from '@/components/shared/race-row';
import { HomeMotion } from '@/components/shared/home-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { getRaceState } from '@/lib/race';

function closeCopy(daysLeft: number): string {
  if (daysLeft <= 0) return 'polls close today';
  if (daysLeft === 1) return 'polls close tomorrow';
  return `polls close in ${daysLeft} days`;
}

export default async function Home() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [raceBoard, latestPlatinumsData, users, stats] = await Promise.all([
    getHallOfFame(8, currentUserId),
    getLatestPlatinums(12, currentUserId),
    getUsers(),
    getMonthlyRaceStats(),
  ]);

  const race = getRaceState();
  const latestPlatinums = latestPlatinumsData;
  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  const entries: RaceEntry[] = raceBoard.map((p) => ({
    id: p.id,
    gameName: p.gameName,
    imageUrl: p.imageUrl,
    width: p.width,
    height: p.height,
    platform: p.platform,
    username: getUserById(p.userId)?.username ?? 'a hunter',
    monthlyVotes: p.monthlyVotes,
    isSpoiler: p.isSpoiler,
  }));

  return (
    <HomeMotion>
    <div>
      {/* The browse screen itself: the field is the page, the race row is the hero. */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 pb-10 pt-24">
        <div className="absolute inset-x-0 top-4 flex justify-center px-4">
          <div className="hm-strip panel-solid flex max-w-full flex-wrap items-center justify-center gap-x-3 rounded-full px-5 py-2 text-center">
            <span className="field-mark">{race.monthLabel}</span>
            <span aria-hidden className="text-border">|</span>
            <span className="tabular text-sm font-semibold">
              {stats.plates} plates · {stats.votes} votes cast
            </span>
            <span aria-hidden className="text-border">|</span>
            <span className="text-sm font-semibold text-primary">{closeCopy(race.daysLeft)}</span>
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
          <RaceRow entries={entries} />
        </div>

        <p className="hm-hint field-mark">
          Arrows or scroll to browse · Enter opens the plate
        </p>
      </section>

      {/* Latest plates: the gallery sheet on the field. */}
      <section id="latest" className="container scroll-mt-24 pb-16">
        <div className="hm-reveal panel rounded-2xl p-6 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="field-mark">Fresh from the case</p>
              <h2 className="mt-1 font-headline text-2xl font-bold tracking-tight md:text-3xl">
                Latest platinums
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/explore">Open the full gallery</Link>
            </Button>
          </div>
          {latestPlatinums.length > 0 ? (
            <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4">
              {latestPlatinums.map((platinum, index) => (
                <div key={platinum.id} className="mb-6 break-inside-avoid">
                  <PlatinumCard
                    platinum={platinum}
                    user={getUserById(platinum.userId)}
                    index={index}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-muted-foreground">
              No plates on the shelves yet. Yours could open the show.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="container scroll-mt-24 pb-20">
        <div className="hm-reveal panel mx-auto max-w-3xl rounded-2xl px-6 py-16 text-center">
          <p className="field-mark">Next issue · {race.monthLabel}</p>
          <h2 className="mt-2 font-headline text-3xl font-bold tracking-tight text-balance md:text-4xl">
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
      </section>
    </div>
    </HomeMotion>
  );
}
