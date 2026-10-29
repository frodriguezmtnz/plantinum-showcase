import { cache } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getProfileGalleryItems,
  getProfileSummary,
  getUserProfileByUsername,
} from '@/lib/data';
import { getFollowState } from '@/lib/follows';
import { auth } from '@/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { FollowButton } from '@/components/shared/follow-button';
import { JsonLd } from '@/components/shared/json-ld';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';
import {
  ProfileStats,
  type ProfilePaceFilter,
} from '@/components/profile/profile-stats';
import { ProfileGalleryClient } from '@/components/profile/profile-gallery-client';
import {
  ProfileTabs,
  type ProfileTab,
} from '@/components/profile/profile-tabs';
import { ProfileAbout } from '@/components/profile/profile-about';
import { ShareProfileButton } from '@/components/profile/share-profile-button';
import { absoluteAssetUrl, canonicalUrl } from '@/lib/seo';
import {
  parseProfileInfinite,
  parseProfilePlatform,
  parseProfileSort,
  parseProfileView,
} from '@/lib/profile-gallery';
import {
  BarChart3,
  Pencil,
  ThumbsUp,
  UserCheck,
  Users,
} from 'lucide-react';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    tab?: string;
    pace?: string;
    platform?: string;
    sort?: string;
    view?: string;
    infinite?: string;
  }>;
};

// generateMetadata and the page render in the same request; cache() keeps the
// profile lookup to one query.
const loadProfile = cache(getUserProfileByUsername);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadProfile(username);

  if (!profile) {
    return {
      title: 'User Not Found',
    };
  }

  const { user, bio } = profile;

  return {
    title: `${user.username}'s Profile | Platinum Showcase`,
    description:
      bio ??
      `Check out ${user.username}'s collection of PlayStation platinum trophies.`,
    alternates: { canonical: `/u/${user.username}` },
  };
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const {
    tab: rawTab,
    pace: rawPace,
    platform: rawPlatform,
    sort: rawSort,
    view: rawView,
    infinite: rawInfinite,
  } = await searchParams;

  const profile = await loadProfile(username);
  if (!profile) {
    notFound();
  }

  const { user, bio, links, createdAt } = profile;
  const tab: ProfileTab =
    rawTab === 'stats' ? 'stats' : rawTab === 'about' ? 'about' : 'gallery';

  const session = await auth();
  const currentUserId = session?.user?.id;
  const isOwner = currentUserId === user.id;
  const pace: ProfilePaceFilter = rawPace === 'all' ? 'all' : 'active';
  const platform = parseProfilePlatform(rawPlatform);
  const sort = parseProfileSort(rawSort);
  const view = parseProfileView(rawView);
  const infinite = parseProfileInfinite(rawInfinite);

  const [summary, followState, gallery] = await Promise.all([
    getProfileSummary(user.id, currentUserId),
    getFollowState(user.id, currentUserId),
    tab === 'gallery'
      ? getProfileGalleryItems({
          userId: user.id,
          currentUserId,
          platform,
          sort,
        })
      : Promise.resolve(null),
  ]);

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
      ...(bio ? { description: bio } : {}),
      ...(links.length > 0 ? { sameAs: links.map((link) => link.url) } : {}),
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <JsonLd data={profileJsonLd} />
      <div className="flex flex-col items-center text-center mb-10">
        <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
          <AvatarImage src={user.avatarUrl} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-bold font-headline">{user.username}</h1>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-muted-foreground">
          <div className="flex items-center gap-2">
            <PlatinumTrophyIcon className="w-5 h-5" />
            <span>{summary.totalPlatinums} Platinums</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-primary" />
            <span>{summary.totalVotes} Total Votes</span>
          </div>
          <Link
            href={`/u/${user.username}/followers`}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <Users className="w-5 h-5" />
            <span>
              <span className="tabular font-semibold text-foreground">
                {followState.followers}
              </span>{' '}
              Followers
            </span>
          </Link>
          <Link
            href={`/u/${user.username}/following`}
            className="flex items-center gap-2 transition-colors hover:text-foreground"
          >
            <UserCheck className="w-5 h-5" />
            <span>
              <span className="tabular font-semibold text-foreground">
                {followState.following}
              </span>{' '}
              Following
            </span>
          </Link>
        </div>
        {followState.followsYou && !isOwner && (
          <p className="mt-3 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
            Follows you
          </p>
        )}
        <div className="mt-4 flex items-center gap-2">
          {isOwner ? (
            <Button asChild variant="outline">
              <Link href="/settings">
                <Pencil className="h-4 w-4" />
                Edit profile
              </Link>
            </Button>
          ) : (
            <FollowButton
              username={user.username}
              initialIsFollowing={followState.isFollowing}
            />
          )}
          <ShareProfileButton username={user.username} />
        </div>
      </div>

      <ProfileTabs username={user.username} tab={tab} />

      {isOwner && (
        <div className="-mt-6 mb-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/explore?source=following"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Following feed →
          </Link>
          <Link
            href="/hall-of-fame?scope=circle"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            My circle →
          </Link>
        </div>
      )}

      {tab === 'stats' &&
        (summary.totalPlatinums === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No stats yet"
            description={
              isOwner
                ? 'Upload your first platinum to start building your pace, top votes and platform split.'
                : "This hunter hasn't shared any platinums yet, so there is nothing to chart."
            }
            {...(isOwner
              ? { actionLabel: 'Upload a platinum', actionHref: '/upload' }
              : {})}
          />
        ) : (
          <ProfileStats summary={summary} pace={pace} username={user.username} />
        ))}

      {tab === 'about' && (
        <ProfileAbout
          username={user.username}
          bio={bio}
          links={links}
          createdAt={createdAt}
          isOwner={isOwner}
        />
      )}

      {tab === 'gallery' && gallery && (
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-6 text-center font-headline">
            {isOwner
              ? 'Your Platinum Trophy Gallery'
              : `${user.username}'s Platinum Trophy Gallery`}
          </h2>
          <ProfileGalleryClient
            key={`${platform}|${sort}`}
            username={user.username}
            user={user}
            isOwner={isOwner}
            initialItems={gallery.items}
            initialTotal={gallery.total}
            initialHasMore={gallery.hasMore}
            platform={platform}
            sort={sort}
            view={view}
            infinite={infinite}
            pace={pace}
          />
        </section>
      )}
    </div>
  );
}
