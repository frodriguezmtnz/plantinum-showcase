/**
 * Watermark placement options. Kept in a sharp-free module so client code
 * (the upload form and its schema) can import them without pulling `sharp`
 * into the browser bundle. The watermark itself is baked in on upload.
 */
export const WATERMARK_POSITIONS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export const DEFAULT_WATERMARK_POSITION: WatermarkPosition = "bottom-right";
