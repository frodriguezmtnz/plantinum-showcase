"use client";

import { PrismGalleryProvider } from "./renderer-context";
import { PrismGallery, type PrismGalleryItem } from "./prism-gallery";

export interface PrismGallerySectionProps {
  items: PrismGalleryItem[];
  label: string;
  autoplay?: boolean;
  aspectRatio?: string;
  fov?: number;
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
