import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLatestPlatinums, getMostVotedPlatinums } from '@/lib/data';
import { designPreviewsEnabled } from '@/lib/design-previews';
import { PrismGalleryPreview } from './preview';

export const metadata: Metadata = {
  title: 'Prism gallery preview | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default async function PrismGalleryPreviewPage() {
  if (!designPreviewsEnabled()) notFound();

  const featured = await getMostVotedPlatinums(8);
  const plates = featured.length >= 2 ? featured : await getLatestPlatinums(8);
  const items = plates.map((plate) => ({
    id: plate.id,
    image: plate.imageUrl,
    alt: `Platinum screenshot for ${plate.gameName}`,
  }));

  return <PrismGalleryPreview items={items} />;
}
