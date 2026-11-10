import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getModeratorAccess } from '@/lib/roles';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Guards every route under /admin/*. The authorization re-reads the role from
 * the database on each request, so a demotion takes effect immediately even
 * with an old JWT.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin/reports');
  }
  const access = await getModeratorAccess(session.user.id);
  if (!access.isModerator) {
    notFound();
  }
  if (!access.twoFactorEnabled) {
    redirect('/settings#security');
  }
  return children;
}
