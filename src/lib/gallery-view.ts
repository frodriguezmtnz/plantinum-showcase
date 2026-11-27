export const GALLERY_VIEWS = [
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
] as const;

export type GalleryView = (typeof GALLERY_VIEWS)[number]['value'];

export const DEFAULT_GALLERY_VIEW: GalleryView = 'grid';

export function parseGalleryView(value?: string): GalleryView {
  return GALLERY_VIEWS.some((option) => option.value === value)
    ? (value as GalleryView)
    : DEFAULT_GALLERY_VIEW;
}
