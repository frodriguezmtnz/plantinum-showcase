import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Flag, ShieldCheck } from 'lucide-react';
import { auth } from '@/auth';
import { isModerator } from '@/lib/roles';
import { getHiddenPlatinums, getOpenReports, MODERATION_PAGE_SIZE } from '@/lib/data';
import { REPORT_REASON_LABELS } from '@/lib/report-labels';
import { ReportReason } from '@/generated/prisma/enums';
import { getCachedVerdicts, type ImageVerdictView } from '@/lib/verdicts';
import { isStoredImage } from '@/lib/utils';
import {
  HiddenPlateActions,
  ReportRowActions,
} from '@/components/shared/moderation-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata = {
  title: 'Moderation | Platinum Showcase',
};

const REASONS = Object.values(ReportReason);

type ReportFilter = ReportReason | 'all';

type AdminReportsSearchParams = {
  rpage?: string;
  hpage?: string;
  reason?: string;
};

type Props = {
  searchParams: Promise<AdminReportsSearchParams>;
};

function parsePage(value?: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
}

function buildHref(params: {
  reason?: ReportFilter;
  rpage?: number;
  hpage?: number;
}): string {
  const search = new URLSearchParams();
  if (params.reason && params.reason !== 'all') search.set('reason', params.reason);
  if (params.rpage && params.rpage > 1) search.set('rpage', String(params.rpage));
  if (params.hpage && params.hpage > 1) search.set('hpage', String(params.hpage));
  const query = search.toString();
  return `/admin/reports${query ? `?${query}` : ''}`;
}

function PlateThumb({
  imageUrl,
  isSpoiler,
}: {
  imageUrl: string;
  isSpoiler: boolean;
}) {
  if (isSpoiler) {
    return (
      <div className="spoiler-frost-strong flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Spoiler
      </div>
    );
  }
  return (
    <Image
      src={imageUrl}
      alt=""
      width={96}
      height={64}
      className="h-16 w-24 shrink-0 rounded-md object-cover"
      unoptimized={isStoredImage(imageUrl)}
    />
  );
}

function AiVerdictBadge({ verdict }: { verdict?: ImageVerdictView }) {
  if (!verdict) return null;
  const styles =
    verdict.label === 'SAFE'
      ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
      : verdict.label === 'UNSAFE'
        ? 'border-destructive/50 text-destructive'
        : 'border-amber-500/50 text-amber-600 dark:text-amber-400';
  const label =
    verdict.label === 'SAFE'
      ? 'AI: looks fine'
      : verdict.label === 'UNSAFE'
        ? 'AI: unsafe'
        : 'AI: review';
  const title = [
    verdict.category,
    verdict.confidence != null ? `${Math.round(verdict.confidence * 100)}%` : null,
    verdict.summary,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Badge variant="outline" className={styles} title={title || undefined}>
      {label}
    </Badge>
  );
}

function FilterPill({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button asChild size="sm" variant={active ? 'default' : 'outline'}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function Pagination({
  label,
  total,
  page,
  hasMore,
  hrefForPage,
}: {
  label: string;
  total: number;
  page: number;
  hasMore: boolean;
  hrefForPage: (page: number) => string;
}) {
  if (total === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span className="tabular">
        {total} {label} · page {page}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Button asChild size="sm" variant="outline">
            <Link href={hrefForPage(page - 1)}>Newer</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Newer
          </Button>
        )}
        {hasMore ? (
          <Button asChild size="sm" variant="outline">
            <Link href={hrefForPage(page + 1)}>Older</Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled>
            Older
          </Button>
        )}
      </div>
    </div>
  );
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin/reports');
  }
  if (!(await isModerator(session.user.id))) {
    notFound();
  }

  const params = await searchParams;
  const reason: ReportFilter =
    params.reason && (REASONS as string[]).includes(params.reason)
      ? (params.reason as ReportReason)
      : 'all';
  const reportsPage = parsePage(params.rpage);
  const hiddenPage = parsePage(params.hpage);

  const [reports, hidden] = await Promise.all([
    getOpenReports({
      reason,
      offset: (reportsPage - 1) * MODERATION_PAGE_SIZE,
    }),
    getHiddenPlatinums({ offset: (hiddenPage - 1) * MODERATION_PAGE_SIZE }),
  ]);

  const verdicts = await getCachedVerdicts([
    ...reports.items.map((report) => report.hash),
    ...hidden.items.map((plate) => plate.hash),
  ]);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
        <div>
          <h1 className="text-3xl font-bold font-headline">Moderation</h1>
          <p className="text-sm text-muted-foreground">
            {reports.total} open {reports.total === 1 ? 'report' : 'reports'} ·{' '}
            {hidden.total} hidden
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold font-headline">Open reports</h2>

        {reports.total > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <FilterPill
              active={reason === 'all'}
              href={buildHref({ rpage: 1, hpage: hiddenPage })}
            >
              All
            </FilterPill>
            {REASONS.map((item) => (
              <FilterPill
                key={item}
                active={reason === item}
                href={buildHref({ reason: item, rpage: 1, hpage: hiddenPage })}
              >
                {REPORT_REASON_LABELS[item]}
              </FilterPill>
            ))}
          </div>
        )}

        {reports.items.length === 0 ? (
          <EmptyState
            icon={Flag}
            title={reason === 'all' ? 'Nothing to review' : 'No reports with that reason'}
            description={
              reason === 'all'
                ? 'No open reports right now. Nice.'
                : 'Try another reason or clear the filter.'
            }
          />
        ) : (
          <ul className="space-y-3">
            {reports.items.map((report) => (
              <li
                key={report.id}
                className="panel-solid flex flex-col gap-4 rounded-xl p-4 sm:flex-row"
              >
                <Link href={`/platinum/${report.platinumId}`} className="shrink-0">
                  <PlateThumb imageUrl={report.imageUrl} isSpoiler={report.isSpoiler} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/platinum/${report.platinumId}`}
                      className="truncate font-semibold hover:underline"
                    >
                      {report.gameName}
                    </Link>
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      {REPORT_REASON_LABELS[report.reason]}
                    </Badge>
                    <AiVerdictBadge verdict={verdicts[report.hash]} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {report.ownerUsername} · reported by {report.reporterUsername} ·{' '}
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </p>
                  {report.message && (
                    <p className="mt-2 rounded-md bg-muted/40 p-2 text-sm italic">
                      {report.message}
                    </p>
                  )}
                  <div className="mt-3">
                    <ReportRowActions reportId={report.id} gameName={report.gameName} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          label={reports.total === 1 ? 'open report' : 'open reports'}
          total={reports.total}
          page={reportsPage}
          hasMore={reports.hasMore}
          hrefForPage={(page) => buildHref({ reason, rpage: page, hpage: hiddenPage })}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold font-headline">Hidden plates</h2>
        {hidden.items.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nothing hidden"
            description="No plates are currently taken down."
          />
        ) : (
          <ul className="space-y-3">
            {hidden.items.map((plate) => (
              <li
                key={plate.id}
                className="panel-solid flex flex-col gap-4 rounded-xl p-4 sm:flex-row"
              >
                <Link href={`/platinum/${plate.id}`} className="shrink-0">
                  <PlateThumb imageUrl={plate.imageUrl} isSpoiler={plate.isSpoiler} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/platinum/${plate.id}`}
                      className="truncate font-semibold hover:underline"
                    >
                      {plate.gameName}
                    </Link>
                    <Badge variant="outline" className="border-destructive/50 text-destructive">
                      Hidden
                    </Badge>
                    <AiVerdictBadge verdict={verdicts[plate.hash]} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {plate.ownerUsername} · {plate.reportCount}{' '}
                    {plate.reportCount === 1 ? 'report' : 'reports'}
                  </p>
                  <div className="mt-3">
                    <HiddenPlateActions platinumId={plate.id} gameName={plate.gameName} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          label={hidden.total === 1 ? 'hidden plate' : 'hidden plates'}
          total={hidden.total}
          page={hiddenPage}
          hasMore={hidden.hasMore}
          hrefForPage={(page) => buildHref({ reason, hpage: page, rpage: reportsPage })}
        />
      </section>
    </div>
  );
}
