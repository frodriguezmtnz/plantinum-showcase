import { prisma } from '@/lib/prisma';
import { toUserView, type User } from '@/lib/data';

export const FOLLOW_PAGE_SIZE = 20;

export interface FollowState {
  isFollowing: boolean;
  followsYou: boolean;
  followers: number;
  following: number;
}

export interface FollowListItem extends User {
  /** Whether the viewer follows this hunter (always false for signed-out). */
  isFollowing: boolean;
  /** Whether this hunter follows the viewer (always false for signed-out). */
  followsYou: boolean;
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
  const [followers, following, edge, reverseEdge] = await Promise.all([
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
    viewerId && viewerId !== profileUserId
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: profileUserId,
              followingId: viewerId,
            },
          },
          select: { id: true },
        })
      : null,
  ]);

  return {
    isFollowing: Boolean(edge),
    followsYou: Boolean(reverseEdge),
    followers,
    following,
  };
}

/** Mark each row with the viewer's own follow edge in one extra query. */
async function attachViewerFollows(
  items: User[],
  viewerId?: string,
): Promise<FollowListItem[]> {
  if (!viewerId || items.length === 0) {
    return items.map((item) => ({
      ...item,
      isFollowing: false,
      followsYou: false,
    }));
  }

  const ids = items.map((item) => item.id);
  const [edges, reverseEdges] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: viewerId, followingId: { in: ids } },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followingId: viewerId, followerId: { in: ids } },
      select: { followerId: true },
    }),
  ]);

  const followed = new Set(edges.map((edge) => edge.followingId));
  const followsViewer = new Set(reverseEdges.map((edge) => edge.followerId));

  return items.map((item) => ({
    ...item,
    isFollowing: followed.has(item.id),
    followsYou: followsViewer.has(item.id),
  }));
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
