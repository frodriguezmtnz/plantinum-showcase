import Link from 'next/link';
import type { Platinum } from '@/lib/data';

const PLATFORMS = ['PS5', 'PS4', 'PS3'] as const;

/** Activity summary for a profile: monthly pace, most voted plates, platforms. */
export function ProfileStats({ platinums }: { platinums: Platinum[] }) {
  if (platinums.length === 0) return null;

  const totalVotes = platinums.reduce((sum, platinum) => sum + platinum.votes, 0);

  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString('en-US', { month: 'short' }),
      count: 0,
    };
  });

  for (const platinum of platinums) {
    const date = new Date(platinum.platinumDate);
    const month = months.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (month) month.count += 1;
  }

  const peak = Math.max(1, ...months.map((month) => month.count));
  const activeMonths = months.filter((month) => month.count > 0).length;

  const platformCounts = { PS5: 0, PS4: 0, PS3: 0 };
  for (const platinum of platinums) platformCounts[platinum.platform] += 1;

  const topVoted = [...platinums].sort((a, b) => b.votes - a.votes).slice(0, 3);

  return (
    <section className="mb-12 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="panel-solid rounded-2xl p-6">
        <h2 className="field-mark">Platinum pace</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Platinums per month over the last year.
        </p>
        <div className="mt-6 flex items-end gap-1.5">
          {months.map((month) => (
            <div key={month.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="tabular h-3 text-[10px] text-muted-foreground">
                {month.count || ''}
              </span>
              <div
                className="flex h-28 w-full items-end"
                title={`${month.label}: ${month.count} platinum${month.count === 1 ? '' : 's'}`}
              >
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${Math.max(3, (month.count / peak) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{month.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {activeMonths} active month{activeMonths === 1 ? '' : 's'} · {totalVotes} vote
          {totalVotes === 1 ? '' : 's'} received
        </p>
      </div>

      <div className="panel-solid rounded-2xl p-6">
        <h2 className="field-mark">Most voted</h2>
        {totalVotes > 0 ? (
          <ol className="mt-4 space-y-3">
            {topVoted.map((platinum, index) => (
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
                <span className="tabular text-sm text-muted-foreground">{platinum.votes}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No votes yet.</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {PLATFORMS.filter((platform) => platformCounts[platform] > 0).map((platform) => (
            <span key={platform} className="field-mark">
              {platform} {platformCounts[platform]}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
