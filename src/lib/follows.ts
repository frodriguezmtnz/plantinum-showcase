import { prisma } from '@/lib/prisma';
import { toUserView, type User } from '@/lib/data';

export const FOLLOW_PAGE_SIZE = 20;

export interface FollowState {
  isFollowing: boolean;
  followers: number;
  following: number;
}

export interface FollowListItem extends User {
  /** Whether the viewer follows this hunter (always false for signed-out). */
  isFollowing: boolean;
}

export interface FollowPage {
  items: FollowListItem[];
  total: number;
  hasMore: boolean;
}

/** Counts plus whether `viewerId` already follows `profileUserId`. */
export async function getFollowState(
  profileUserId: string,
  viewerId?: string,
): Promise<FollowState> {
  const [followers, following, edge] = await Promise.all([
    prisma.follow.count({ where: { followingId: profileUserId } }),
    prisma.follow.count({ where: { followerId: profileUserId } }),
    viewerId && viewerId !== profileUserId
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: profileUserId,
            },
          },
          select: { id: true },
        })
      : null,
  ]);

  return { isFollowing: Boolean(edge), followers, following };
}

/** Mark each row with the viewer's own follow edge in one extra query. */
async function attachViewerFollows(
  items: User[],
  viewerId?: string,
): Promise<FollowListItem[]> {
  if (!viewerId || items.length === 0) {
    return items.map((item) => ({ ...item, isFollowing: false }));
  }

  const edges = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: items.map((item) => item.id) },
    },
    select: { followingId: true },
  });
  const followed = new Set(edges.map((edge) => edge.followingId));

  return items.map((item) => ({ ...item, isFollowing: followed.has(item.id) }));
}

/** Hunters following `userId`, newest edge first. */
export async function getFollowersPage(
  userId: string,
  options: { offset?: number; limit?: number; viewerId?: string } = {},
): Promise<FollowPage> {
  const { offset = 0, limit = FOLLOW_PAGE_SIZE, viewerId } = options;
  const where = { followingId: userId };

  const [total, edges] = await Promise.all([
    prisma.follow.count({ where }),
    prisma.follow.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit + 1,
      include: { follower: true },
    }),
  ]);

  const hasMore = edges.length > limit;
  const users = edges.slice(0, limit).map((edge) => toUserView(edge.follower));

  return { items: await attachViewerFollows(users, viewerId), total, hasMore };
}

/** Hunters `userId` follows, newest edge first. */
export async function getFollowingPage(
  userId: string,
  options: { offset?: number; limit?: number; viewerId?: string } = {},
): Promise<FollowPage> {
  const { offset = 0, limit = FOLLOW_PAGE_SIZE, viewerId } = options;
  const where = { followerId: userId };

  const [total, edges] = await Promise.all([
    prisma.follow.count({ where }),
    prisma.follow.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit + 1,
      include: { following: true },
    }),
  ]);

  const hasMore = edges.length > limit;
  const users = edges.slice(0, limit).map((edge) => toUserView(edge.following));

  return { items: await attachViewerFollows(users, viewerId), total, hasMore };
}
