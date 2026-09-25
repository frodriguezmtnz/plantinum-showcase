
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SiteChrome } from '@/components/layout/site-chrome';
import { cn } from '@/lib/utils';
import { SessionProvider } from 'next-auth/react';
import { Inter, Outfit } from 'next/font/google';

const APP_NAME = "Platinum Showcase";
const APP_DESCRIPTION = "Showcase your PlayStation platinum trophies and climb the leaderboards.";

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontHeadline = Outfit({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['700', '900'],
});

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
  themeColor: "#030712",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark', fontBody.variable, fontHeadline.variable)} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-body antialiased",
      )}>
        <SessionProvider>
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
