
import { getProfileGalleryPage, getProfileSummary, getUserByUsername } from '@/lib/data';
import { auth } from '@/auth';
import { PlatinumCard } from '@/components/shared/platinum-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound } from 'next/navigation';
import { ThumbsUp, Trophy } from 'lucide-react';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';
import { EmptyState } from '@/components/shared/empty-state';
import { JsonLd } from '@/components/shared/json-ld';
import {
  ProfileStats,
  type ProfilePaceFilter,
} from '@/components/profile/profile-stats';
import { Button } from '@/components/ui/button';
import { absoluteAssetUrl, canonicalUrl } from '@/lib/seo';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; pace?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: 'User Not Found',
    };
  }

  return {
    title: `${user.username}'s Profile | Platinum Showcase`,
    description: `Check out ${user.username}'s collection of PlayStation platinum trophies.`,
    alternates: { canonical: `/u/${user.username}` },
  };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { page: rawPage, pace: rawPace } = await searchParams;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  const session = await auth();
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === user.id;
  const pace: ProfilePaceFilter = rawPace === 'all' ? 'all' : 'active';
  const requestedPage = Number(rawPage ?? '1');

  const [summary, gallery] = await Promise.all([
    getProfileSummary(user.id, currentUserId),
    getProfileGalleryPage(user.id, currentUserId, { page: requestedPage }),
  ]);

  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (target > 1) params.set('page', String(target));
    if (pace === 'all') params.set('pace', 'all');
    const query = params.toString();
    return `/u/${user.username}${query ? `?${query}` : ''}`;
  };

  const profileUrl = canonicalUrl(`/u/${user.username}`);
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: profileUrl,
    mainEntity: {
      '@type': 'Person',
      name: user.username,
      alternateName: user.username,
      url: profileUrl,
      image: absoluteAssetUrl(user.avatarUrl),
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <JsonLd data={profileJsonLd} />
      <div className="flex flex-col items-center text-center mb-12">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-bold font-headline">{user.username}</h1>
        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <PlatinumTrophyIcon className="w-5 h-5"/>
            <span>{summary.totalPlatinums} Platinums</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary"/>
            <span>{summary.totalVotes} Total Votes</span>
          </div>
        </div>
      </div>

      <ProfileStats summary={summary} pace={pace} username={user.username} />

      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-6 text-center font-headline">Your Platinum Trophy Gallery</h2>
        {gallery.total > 0 ? (
          <>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {gallery.items.map(platinum => (
                <div key={platinum.id} className="mb-6 break-inside-avoid">
                  <PlatinumCard platinum={platinum} user={user} showComment={isOwner} canDelete={isOwner} canEdit={isOwner} />
                </div>
              ))}
            </div>
            {gallery.totalPages > 1 && (
              <nav
                className="mt-10 flex flex-wrap items-center justify-center gap-3"
                aria-label="Gallery pages"
              >
                {gallery.currentPage > 1 ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(gallery.currentPage - 1)}>Previous</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                )}
                <span className="tabular text-sm text-muted-foreground">
                  Page {gallery.currentPage} of {gallery.totalPages}
                </span>
                {gallery.currentPage < gallery.totalPages ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={pageHref(gallery.currentPage + 1)}>Next</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                )}
              </nav>
            )}
          </>
        ) : (
          <EmptyState
            icon={Trophy}
            title="No platinums yet"
            description="This hunter hasn't shared any platinum screenshots yet."
            actionLabel="Upload a platinum"
            actionHref="/upload"
          />
        )}
      </section>
    </div>
  );
}
