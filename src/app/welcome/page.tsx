import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { safeRelativeCallback } from '@/lib/callback-url';
import { WelcomeForm } from './welcome-form';

export const metadata: Metadata = {
  title: 'Choose your username | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/login?callbackUrl=/welcome');
  }

  const { callbackUrl } = await searchParams;
  const requested = safeRelativeCallback(callbackUrl);
  // Never bounce back into onboarding itself.
  const target = requested.startsWith('/welcome') ? '/' : requested;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true },
  });
  if (!user) {
    redirect('/login');
  }
  if (user.username) {
    redirect(target);
  }

  return <WelcomeForm email={user.email} callbackUrl={target} />;
}
