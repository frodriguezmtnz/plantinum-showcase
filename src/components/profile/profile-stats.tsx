import Link from 'next/link';
import type { ProfileSummary } from '@/lib/data';
import { formatPeriodShortLabel } from '@/lib/period';
import { cn } from '@/lib/utils';

export type ProfilePaceFilter = 'active' | 'all';

interface ProfileStatsProps {
  summary: ProfileSummary;
  pace: ProfilePaceFilter;
  username: string;
}

/** Activity summary for a profile: monthly pace, top voted plates, platforms. */
export function ProfileStats({
  summary,
  pace,
  username,
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

  return (
    <section className="mb-12 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="panel-solid rounded-2xl p-6">
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
          {summary.activeMonths === 1 ? '' : 's'} · {summary.totalVotes} vote
          {summary.totalVotes === 1 ? '' : 's'} received
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
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

        <div className="panel-solid rounded-2xl p-6">
          <h2 className="field-mark">Platforms</h2>
          {summary.platforms.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No platinums assigned to a platform yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {summary.platforms.map(({ platform, count }) => {
                const width = platformTotal > 0 ? (count / platformTotal) * 100 : 0;
                return (
                  <li key={platform} data-platform={platform}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{platform}</span>
                      <span className="tabular text-muted-foreground">{count}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
