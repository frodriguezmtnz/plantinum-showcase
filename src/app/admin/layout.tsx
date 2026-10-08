import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isModerator } from '@/lib/roles';

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
  if (!(await isModerator(session.user.id))) {
    notFound();
  }
  return children;
}
