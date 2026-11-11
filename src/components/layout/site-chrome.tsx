'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

const CHROMELESS_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/confirm-email-change',
  '/welcome',
];

interface SiteChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const hideChrome = CHROMELESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Google users are created without a handle. `pages.newUser` sends them to
  // /welcome on the first login, but this guard catches later visits that land
  // on a normal page (closed tab, another device, etc.).
  useEffect(() => {
    if (hideChrome || status !== 'authenticated') return;
    if (session?.user && !session.user.name) {
      const target = `${window.location.pathname}${window.location.search}`;
      router.replace(`/welcome?callbackUrl=${encodeURIComponent(target)}`);
    }
  }, [hideChrome, status, session?.user, router]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {!hideChrome && (
        <>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
          >
            Skip to content
          </a>
          {header}
        </>
      )}
      <main
        id="main"
        tabIndex={-1}
        className={hideChrome ? 'flex-1 outline-none' : 'flex-1 outline-none animate-in fade-in duration-300'}
      >
        {children}
      </main>
      {!hideChrome && footer}
    </div>
  );
}
