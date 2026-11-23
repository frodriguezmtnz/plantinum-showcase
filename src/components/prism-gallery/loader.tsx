import dynamic from "next/dynamic";

import type { PrismGallerySectionProps } from "./section";

export const PrismGallerySection = dynamic<PrismGallerySectionProps>(
  () => import("./section").then((mod) => mod.PrismGallerySection),
);
