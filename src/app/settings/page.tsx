import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { countUploadsInCurrentPeriod } from '@/lib/data';
import { SettingsClient } from '@/components/settings/settings-client';
import {
  legacyProfileLink,
  toProfileLinkView,
  type ProfileLinkView,
} from '@/lib/profile-links';

export const metadata: Metadata = {
  title: 'Settings | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/login?callbackUrl=/settings');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      email: true,
      emailVerified: true,
      image: true,
      bio: true,
      psnProfileUrl: true,
      profileLinks: {
        orderBy: { createdAt: 'asc' },
        select: { provider: true, handle: true, url: true },
      },
      plan: true,
      role: true,
      twoFactorEnabled: true,
      usernameChangedAt: true,
      notifyFollowedUploads: true,
    },
  });

  if (!user?.username) {
    redirect('/login?callbackUrl=/settings');
  }

  const uploadsUsed = await countUploadsInCurrentPeriod(userId);

  const rows = user.profileLinks
    .map((row) => toProfileLinkView(row))
    .filter((link): link is ProfileLinkView => link !== null);
  const links =
    rows.length > 0
      ? rows
      : [legacyProfileLink(user.psnProfileUrl)].filter(
          (link): link is ProfileLinkView => link !== null,
        );

  return (
    <SettingsClient
      user={{
        username: user.username,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        image: user.image,
        bio: user.bio,
        initialLinks: links.map(({ provider, handle }) => ({
          provider,
          handle,
        })),
        plan: user.plan,
        usernameChangedAt: user.usernameChangedAt?.toISOString() ?? null,
        notifyFollowedUploads: user.notifyFollowedUploads,
        uploadsUsed,
        twoFactorEnabled: user.twoFactorEnabled,
        isPrivileged: user.role === 'MODERATOR' || user.role === 'ADMIN',
      }}
    />
  );
}
