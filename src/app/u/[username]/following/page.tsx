import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserByUsername } from '@/lib/data';
import { getFollowingPage } from '@/lib/follows';
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
    title: `Trophy hunters ${user.username} follows | Platinum Showcase`,
    description: `The trophy hunters ${user.username} follows on Platinum Showcase.`,
    alternates: { canonical: `/u/${user.username}/following` },
  };
}

export default async function FollowingPage({ params }: Props) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) {
    notFound();
  }

  const session = await auth();
  const page = await getFollowingPage(user.id, {
    viewerId: session?.user?.id,
  });

  return (
    <div className="container py-8 md:py-12">
      <FollowListClient
        username={user.username}
        kind="following"
        initialItems={page.items}
        initialTotal={page.total}
        initialHasMore={page.hasMore}
        isOwner={session?.user?.id === user.id}
      />
    </div>
  );
}
