import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HeroTrophyPreview } from './preview';

export const metadata: Metadata = {
  title: 'Trophy hero preview | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default function TrophyHeroPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <HeroTrophyPreview />;
}
