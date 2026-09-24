'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const CHROMELESS_ROUTES = ['/login', '/register'];

interface SiteChromeProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function SiteChrome({ header, footer, children }: SiteChromeProps) {
  const pathname = usePathname();
  const hideChrome = CHROMELESS_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      {!hideChrome && header}
      <main className={hideChrome ? 'flex-1' : 'flex-1 animate-in fade-in duration-300'}>
        {children}
      </main>
      {!hideChrome && footer}
    </div>
  );
}
