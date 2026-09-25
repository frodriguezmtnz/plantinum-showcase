
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SiteChrome } from '@/components/layout/site-chrome';
import { cn } from '@/lib/utils';
import { SessionProvider } from 'next-auth/react';
import { Mulish } from 'next/font/google';
import { SkyField } from '@/components/shared/sky-field';
import { getRaceState } from '@/lib/race';

const APP_NAME = "Platinum Showcase";
const APP_DESCRIPTION = "Showcase your PlayStation platinum trophies and climb the leaderboards.";

const fontBody = Mulish({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-body',
});

// One family, three registers: the browse screen's voice is weight and
// tracking, not a second face. --font-headline aliases --font-body in @theme.

export const metadata: Metadata = {
  title: 'Platinum Showcase',
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#e3f1f8",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const race = getRaceState();
  return (
    <html lang="en" className={cn(fontBody.variable)} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn(
        "min-h-screen font-body antialiased",
      )}>
        <SessionProvider>
          <SkyField palette={race.palette} />
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
