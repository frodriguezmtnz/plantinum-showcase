import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Flag, ShieldCheck } from 'lucide-react';
import { auth } from '@/auth';
import { isModerator } from '@/lib/roles';
import { getHiddenPlatinums, getOpenReports } from '@/lib/data';
import { REPORT_REASON_LABELS } from '@/lib/report-labels';
import { isStoredImage } from '@/lib/utils';
import {
  HiddenPlateActions,
  ReportRowActions,
} from '@/components/shared/moderation-actions';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata = {
  title: 'Moderation | Platinum Showcase',
};

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

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin/reports');
  }
  if (!(await isModerator(session.user.id))) {
    notFound();
  }

  const [reports, hidden] = await Promise.all([
    getOpenReports(),
    getHiddenPlatinums(),
  ]);

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
        <div>
          <h1 className="text-3xl font-bold font-headline">Moderation</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} open {reports.length === 1 ? 'report' : 'reports'} ·{' '}
            {hidden.length} hidden
          </p>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold font-headline">Open reports</h2>
        {reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="Nothing to review"
            description="No open reports right now. Nice."
          />
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
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
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold font-headline">Hidden plates</h2>
        {hidden.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Nothing hidden"
            description="No plates are currently taken down."
          />
        ) : (
          <ul className="space-y-3">
            {hidden.map((plate) => (
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
      </section>
    </div>
  );
}
