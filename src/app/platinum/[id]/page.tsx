
import { getOpenReportForUser, getPlatinumById, getUserById } from '@/lib/data';
import { auth } from '@/auth';
import { DeletePlatinumButton } from '@/components/shared/delete-platinum-button';
import { EditPlatinumDialog } from '@/components/shared/edit-platinum-dialog';
import { ReportPlatinumButton } from '@/components/shared/report-platinum-button';
import { isModerator } from '@/lib/roles';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Heart, Trophy, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlatinumDetailCard } from './platinum-detail-card';
import type { User } from '@/lib/data';
import { displayImageUrl } from '@/lib/image-display';
import { AppealPlatinumButton } from '@/components/shared/appeal-platinum-button';
import { cn } from '@/lib/utils';
import { SocialShare } from './SocialShare';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const canModerate = session?.user?.id ? await isModerator(session.user.id) : false;
  const platinum = await getPlatinumById(id, session?.user?.id, {
    includeUnpublished: canModerate,
  });

  if (!platinum) {
    return {
      title: 'Platinum Not Found',
    }
  }
  
  const user = await getUserById(platinum.userId);

  const title = `${platinum.gameName} Platinum by ${user?.username || 'a user'} | Platinum Showcase`;
  const description = `Check out the platinum trophy screenshot for ${platinum.gameName}, achieved by ${user?.username}.`;

  const isPublic = platinum.moderationStatus === 'PUBLISHED';

  // Spoiler plates stay out of link previews so sharing never leaks a reveal.
  // Plates under moderation only advertise the pixelated variant, never the raw
  // screenshot, and stay out of search engines until a moderator clears them.
  const images = platinum.isSpoiler
    ? []
    : [
        {
          url: displayImageUrl(platinum.imageUrl, platinum.moderationStatus),
          width: platinum.width,
          height: platinum.height,
          alt: `Platinum screenshot for ${platinum.gameName}`,
        },
      ];

  return {
    title,
    description,
    ...(isPublic ? {} : { robots: { index: false, follow: false } }),
    openGraph: {
      type: 'article',
      title,
      description,
      images,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}


export default async function PlatinumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;
  const canModerate = currentUserId ? await isModerator(currentUserId) : false;
  const platinum = await getPlatinumById(id, currentUserId, {
    includeUnpublished: canModerate,
  });

  if (!platinum) {
    notFound();
  }

  const user: User | undefined = await getUserById(platinum.userId);

  const canDelete = currentUserId === platinum.userId;
  const canReport = currentUserId !== platinum.userId;
  const hasOpenReport = canReport
    ? await getOpenReportForUser(platinum.id, currentUserId)
    : false;

  return (
    <div className="container py-8 md:py-12">
      <Link
        href="/explore"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Explore
      </Link>

      {canDelete && platinum.moderationStatus !== 'PUBLISHED' && (
        <div
          className={cn(
            'mb-6 flex flex-wrap items-center gap-3 rounded-xl border p-4',
            platinum.moderationStatus === 'HIDDEN'
              ? 'border-destructive/60 bg-destructive/10 dark:bg-destructive/15'
              : 'border-amber-500/60 bg-amber-500/15 dark:bg-amber-500/10',
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {platinum.moderationStatus === 'HIDDEN'
                ? 'This platinum is hidden'
                : 'This platinum is under review'}
            </p>
            <p className="text-sm text-muted-foreground">
              {platinum.moderationStatus === 'HIDDEN'
                ? 'A moderator took it down, so only you and the moderators can open it. If you think this is a mistake, appeal and a human will take another look.'
                : 'Only you and the moderators can see it, and everyone else gets a pixelated version. It joins the gallery as soon as it clears screening.'}
            </p>
          </div>
          {platinum.moderationStatus === 'HIDDEN' && (
            <AppealPlatinumButton platinumId={platinum.id} gameName={platinum.gameName} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 min-w-0">
            <PlatinumDetailCard platinum={platinum} user={user ?? null} />
        </div>
        <div className="md:col-span-2 min-w-0">
            <div className="panel-solid p-6 rounded-2xl overflow-hidden">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold font-headline break-words">{platinum.gameName}</h2>
                </div>
                {user && (
                  <div className="mb-6 flex min-w-0 items-center gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                      <AvatarFallback>{user.username.slice(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.username}</p>
                      <Link href={`/u/${user.username}`} className="text-sm text-primary hover:underline">
                        View Profile
                      </Link>
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm mb-6">
                    <p className="flex justify-between gap-3 border-b border-border/60 pb-2"><span className="field-mark">Platform</span><span className="font-semibold">{platinum.platform}</span></p>
                    <p className="flex justify-between gap-3"><span className="field-mark">Achieved on</span><span className="tabular font-semibold">{format(new Date(platinum.platinumDate), 'MMMM d, yyyy')}</span></p>
                </div>
                
                <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg">
                    <div className="flex min-w-0 items-center">
                        <Heart className="mr-2 shrink-0 fill-destructive text-destructive"/>
                        <span className="font-bold tabular text-live">{platinum.votes}</span>
                        <span className="text-muted-foreground ml-1">votes</span>
                    </div>
                     <div className="flex min-w-0 items-center">
                        <Trophy className="mr-2 shrink-0 text-muted-foreground"/>
                        <span className="font-bold tabular text-live">{platinum.monthlyVotes}</span>
                        <span className="text-muted-foreground ml-1">this month</span>
                    </div>
                </div>
                
                <SocialShare platinum={platinum} user={user ?? null} />

                {canReport && (
                  <div className="mt-4">
                    <ReportPlatinumButton
                      platinumId={platinum.id}
                      gameName={platinum.gameName}
                      hasOpenReport={hasOpenReport}
                    />
                  </div>
                )}

                {canDelete && (
                  <>
                    <EditPlatinumDialog
                      platinum={platinum}
                      showLabel
                      className="mt-4 w-full border border-border hover:bg-muted"
                    />
                    <DeletePlatinumButton
                      platinumId={platinum.id}
                      redirectTo="/"
                      showLabel
                      className="mt-2 w-full border border-destructive/40 hover:bg-destructive/10"
                    />
                  </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
