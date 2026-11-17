"use client";

import { PrismGalleryProvider } from "./renderer-context";
import { PrismGallery, type PrismGalleryItem } from "./prism-gallery";
import type { PrismParams } from "./prism-wall";

export interface PrismGallerySectionProps {
  items: PrismGalleryItem[];
  label: string;
  autoplay?: boolean;
  animateInitial?: boolean;
  clipToViewport?: boolean;
  aspectRatio?: string;
  fov?: number;
  params?: Partial<PrismParams>;
  className?: string;
}

export function PrismGallerySection({
  className,
  ...galleryProps
}: PrismGallerySectionProps) {
  return (
    <PrismGalleryProvider>
      <PrismGallery className={className} {...galleryProps} />
    </PrismGalleryProvider>
  );
}
