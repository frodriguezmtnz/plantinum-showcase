import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPlatinumsPage } from '@/lib/data';
import { designPreviewsEnabled } from '@/lib/design-previews';
import { GalleryColumnsPreview } from './preview';

export const metadata: Metadata = {
  title: 'Gallery columns preview | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default async function GalleryColumnsPreviewPage() {
  if (!designPreviewsEnabled()) notFound();

  const { items } = await getPlatinumsPage({ limit: 24 });

  return <GalleryColumnsPreview items={items} />;
}
