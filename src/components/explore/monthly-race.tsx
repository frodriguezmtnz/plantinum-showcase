import Image from 'next/image';
import Link from 'next/link';
import { Crown, Vote } from 'lucide-react';
import { getMonthlyRaceStats } from '@/lib/data';
import { getRaceState } from '@/lib/race';
import { getArchivedRanking, getLatestClosedRanking, type ArchivedEntry } from '@/lib/history';
import { closeCopy, formatPeriodLabel, getCurrentPeriod } from '@/lib/period';
import { isStoredImage } from '@/lib/utils';

/**
 * The live monthly competition — the one place on the site that names a month.
 * The home is an evergreen showcase, so the countdown, this-month totals and
 * the current (or last closed) podium all live here in Explore.
 */
export async function MonthlyRace() {
  const race = getRaceState();
  const currentPeriod = getCurrentPeriod();

  const [stats, current] = await Promise.all([
    getMonthlyRaceStats(),
    getArchivedRanking(currentPeriod, 6),
  ]);

  // The fresh board may not be able to field a podium yet; fall back to the
  // most recent closed month rather than showing an empty shelf.
  const fresh = current.entries.filter((entry) => !entry.isSpoiler);
  let rows: ArchivedEntry[] = fresh.slice(0, 3);
  let archivePeriod: string | null = null;
  if (rows.length < 3) {
    const closed = await getLatestClosedRanking(6);
    const visible = closed?.entries.filter((entry) => !entry.isSpoiler) ?? [];
    if (closed && visible.length >= 3) {
      rows = visible.slice(0, 3);
      archivePeriod = closed.period;
    } else {
      rows = [];
    }
  }

  return (
    <section className="panel-solid rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="field-mark">{race.monthLabel}</p>
          <h2 className="font-headline mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            This month&apos;s race
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="tabular rounded-full bg-secondary/70 px-3 py-1 text-secondary-foreground">
            <Vote className="mr-1 inline h-3.5 w-3.5 text-live" aria-hidden />
            {stats.plates} plates · {stats.votes.toLocaleString('en-US')} votes this month
          </span>
          <span className="text-live">{closeCopy(race.daysLeft)}</span>
        </div>
      </div>

      {rows.length >= 3 ? (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            {archivePeriod
              ? `Last month's podium — ${formatPeriodLabel(archivePeriod)} froze the standings.`
              : 'Live standings. One vote each, every month.'}
          </p>
          <ol className="mt-4 grid grid-cols-1 gap-3">
            {rows.map((entry) => (
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
                    <span className="block truncate text-xs text-muted-foreground">
                      @{entry.username} · {entry.platform}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-xs font-bold text-live sm:text-sm">
                    {entry.votes} votes
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-muted-foreground">
          <Crown className="h-4 w-4 shrink-0 text-dusk" aria-hidden />
          No votes this month yet — be the first plate of {race.monthLabel}.
        </p>
      )}
    </section>
  );
}
