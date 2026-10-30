import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserByUsername } from '@/lib/data';
import { getFollowersPage } from '@/lib/follows';
import { FollowListClient } from '@/components/profile/follow-list-client';

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return { title: 'User Not Found' };
  }

  return {
    title: `${user.username}'s followers | Platinum Showcase`,
    description: `Trophy hunters following ${user.username} on Platinum Showcase.`,
    alternates: { canonical: `/u/${user.username}/followers` },
  };
}

export default async function FollowersPage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  const session = await auth();
  const page = await getFollowersPage(user.id, {
    viewerId: session?.user?.id,
  });

  return (
    <div className="container py-8 md:py-12">
      <FollowListClient
        username={user.username}
        kind="followers"
        initialItems={page.items}
        initialTotal={page.total}
        initialHasMore={page.hasMore}
      />
    </div>
  );
}
