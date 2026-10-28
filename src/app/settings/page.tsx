import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { countUploadsInCurrentPeriod } from '@/lib/data';
import { SettingsClient } from '@/components/settings/settings-client';

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
      image: true,
      bio: true,
      psnProfileUrl: true,
      plan: true,
      usernameChangedAt: true,
    },
  });

  if (!user?.username) {
    redirect('/login?callbackUrl=/settings');
  }

  const uploadsUsed = await countUploadsInCurrentPeriod(userId);

  return (
    <SettingsClient
      user={{
        username: user.username,
        email: user.email,
        image: user.image,
        bio: user.bio,
        psnProfileUrl: user.psnProfileUrl,
        plan: user.plan,
        usernameChangedAt: user.usernameChangedAt?.toISOString() ?? null,
        uploadsUsed,
      }}
    />
  );
}
