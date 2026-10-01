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
