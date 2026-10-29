import Link from 'next/link';
import type { ProfileStanding, ProfileSummary } from '@/lib/data';
import { formatPeriodLabel, formatPeriodShortLabel } from '@/lib/period';
import { cn } from '@/lib/utils';
import { PLATFORM_COLOR_VARS } from '@/lib/chart-theme';
import {
  ProfilePaceArea,
  ProfilePlatformDonut,
} from '@/components/profile/profile-charts';

export type ProfilePaceFilter = 'active' | 'all';

interface ProfileStatsProps {
  summary: ProfileSummary;
  pace: ProfilePaceFilter;
  username: string;
  standing: ProfileStanding | null;
}

function StatTile({
  label,
  value,
  hint,
  dataStat,
}: {
  label: string;
  value: string;
  hint: string;
  dataStat: string;
}) {
  return (
    <div className="panel-solid rounded-2xl p-5" data-stat={dataStat}>
      <p className="field-mark">{label}</p>
      <p className="tabular mt-1 font-headline text-2xl font-bold leading-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** Activity summary for a profile: pace, progress, top votes and platforms. */
export function ProfileStats({
  summary,
  pace,
  username,
  standing,
}: ProfileStatsProps) {
  if (summary.totalPlatinums === 0) return null;

  const months =
    pace === 'active'
      ? summary.months.filter((month) => month.count > 0)
      : summary.months;
  const peak = Math.max(1, ...months.map((month) => month.count));
  const platformTotal = summary.platforms.reduce(
    (sum, platform) => sum + platform.count,
    0,
  );
  const paceHref = (next: ProfilePaceFilter) =>
    `/u/${username}?tab=stats&pace=${next}`;

  const windowTotal = months.reduce((sum, month) => sum + month.count, 0);
  const bestMonth = summary.months.reduce(
    (best, month) => (month.count > best.count ? month : best),
    summary.months[0]!,
  );
  const longestStreak = summary.months.reduce(
    (state, month) => {
      const current = month.count > 0 ? state.current + 1 : 0;
      return {
        current,
        best: Math.max(state.best, current),
      };
    },
    { current: 0, best: 0 },
  ).best;
  const averagePerActiveMonth =
    summary.activeMonths > 0
      ? summary.totalPlatinums / summary.activeMonths
      : 0;
  const aheadOfPlates = standing?.aheadOfPlates ?? null;

  return (
    <section className="mb-12 space-y-4">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid min-w-0 gap-4">
          <div className="panel-solid min-w-0 overflow-hidden rounded-2xl p-6">
            <h2 className="field-mark">Platinum pace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Platinums per month over the last year.
            </p>
            <div className="mt-3 inline-flex rounded-full border border-border/70 bg-background/40 p-0.5 text-xs">
              {(['active', 'all'] as const).map((value) => (
                <Link
                  key={value}
                  href={paceHref(value)}
                  aria-current={pace === value ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3 py-1 font-semibold transition-colors',
                    pace === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value === 'active' ? 'Active months' : 'Last 12 months'}
                </Link>
              ))}
            </div>

            {months.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No platinums in the last year.
              </p>
            ) : (
              <div className="mt-6 flex items-end justify-center gap-1.5">
                {months.map((month) => (
                  <div
                    key={month.key}
                    data-month={month.key}
                    className="flex min-w-0 max-w-20 flex-1 flex-col items-center gap-1"
                  >
                    <span className="tabular h-3 text-[10px] text-muted-foreground">
                      {month.count || ''}
                    </span>
                    <div
                      className="flex h-28 w-full items-end"
                      title={`${formatPeriodShortLabel(month.key)}: ${month.count} platinum${month.count === 1 ? '' : 's'}`}
                    >
                      <div
                        className={cn(
                          'w-full rounded-t',
                          month.count === 0 ? 'bg-border' : 'bg-primary/80',
                        )}
                        style={{
                          height:
                            month.count === 0
                              ? '2px'
                              : `${Math.max(6, (month.count / peak) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatPeriodShortLabel(month.key)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              {summary.activeMonths} active month
              {summary.activeMonths === 1 ? '' : 's'} · {summary.totalVotes}{' '}
              vote
              {summary.totalVotes === 1 ? '' : 's'} received
            </p>
          </div>

          <div className="panel-solid min-w-0 overflow-hidden rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="field-mark">Cumulative progress</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  How the shelf filled up over the same window.
                </p>
              </div>
              <span className="tabular font-headline text-2xl font-bold leading-none">
                {windowTotal}
              </span>
            </div>
            {months.length > 0 ? (
              <div className="mt-3">
                <ProfilePaceArea months={months} total={windowTotal} />
                <table className="sr-only">
                  <caption>Cumulative platinums by month</caption>
                  <thead>
                    <tr>
                      <th scope="col">Month</th>
                      <th scope="col">Platinums</th>
                    </tr>
                  </thead>
                  <tbody>
                    {months.map((month) => (
                      <tr key={month.key}>
                        <th scope="row">{formatPeriodLabel(month.key)}</th>
                        <td>{month.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No platinums to chart in this window.
              </p>
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="panel-solid rounded-2xl p-6">
            <h2 className="field-mark">Top voted</h2>
            {summary.topVoted.length > 0 ? (
              <ol className="mt-4 space-y-3">
                {summary.topVoted.map((platinum, index) => (
                  <li key={platinum.id} className="flex items-center gap-3">
                    <span className="tabular w-5 text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <Link
                      href={`/platinum/${platinum.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-semibold transition-colors hover:text-primary"
                    >
                      {platinum.gameName}
                    </Link>
                    <span className="tabular text-sm text-muted-foreground">
                      {platinum.votes}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No votes yet.</p>
            )}
          </div>

          <div className="panel-solid min-w-0 overflow-hidden rounded-2xl p-6">
            <h2 className="field-mark">Platforms</h2>
            {summary.platforms.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No platinums assigned to a platform yet.
              </p>
            ) : (
              <>
                <ProfilePlatformDonut platforms={summary.platforms} />
                <table className="sr-only">
                  <caption>Platinums by platform</caption>
                  <thead>
                    <tr>
                      <th scope="col">Platform</th>
                      <th scope="col">Platinums</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.platforms.map(({ platform, count }) => (
                      <tr key={platform}>
                        <th scope="row">{platform}</th>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="mt-2 space-y-1.5">
                  {summary.platforms.map(({ platform, count }, index) => {
                    const percent =
                      platformTotal > 0
                        ? Math.round((count / platformTotal) * 100)
                        : 0;
                    return (
                      <li
                        key={platform}
                        data-platform={platform}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: `var(${PLATFORM_COLOR_VARS[index % PLATFORM_COLOR_VARS.length]})`,
                          }}
                        />
                        <span className="min-w-0 flex-1 truncate font-semibold">
                          {platform}
                        </span>
                        <span className="tabular text-muted-foreground">
                          {count}
                        </span>
                        <span className="tabular w-9 text-right text-xs text-muted-foreground">
                          {percent}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-4',
          aheadOfPlates === null ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        <StatTile
          dataStat="streak"
          label="Longest streak"
          value={`${longestStreak} ${longestStreak === 1 ? 'month' : 'months'}`}
          hint="In a row, last 12 months"
        />
        <StatTile
          dataStat="best-month"
          label="Best month"
          value={`${bestMonth.count} platinum${bestMonth.count === 1 ? '' : 's'}`}
          hint={formatPeriodLabel(bestMonth.key)}
        />
        <StatTile
          dataStat="average"
          label="Monthly average"
          value={averagePerActiveMonth.toFixed(1)}
          hint={`Per active month · ${summary.activeMonths} total`}
        />
        {aheadOfPlates !== null && standing && (
          <StatTile
            dataStat="standing"
            label="Board standing"
            value={
              standing.hasHuntersBehind
                ? `Ahead of ${aheadOfPlates}%`
                : 'Just getting started'
            }
            hint={
              !standing.hasHuntersBehind
                ? `${standing.hunters} hunters on the board`
                : standing.aheadOfVotes === null
                  ? 'of hunters'
                  : `of hunters · ${standing.aheadOfVotes}% by votes`
            }
          />
        )}
      </div>
    </section>
  );
}
