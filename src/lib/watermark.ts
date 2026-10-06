import sharp from "sharp";
import {
  DEFAULT_WATERMARK_POSITION,
  type WatermarkPosition,
} from "@/lib/watermark-position";

export {
  WATERMARK_POSITIONS,
  DEFAULT_WATERMARK_POSITION,
  type WatermarkPosition,
} from "@/lib/watermark-position";

/**
 * Baked-in site watermark. Free accounts always get it; the Pro/Supporter
 * entitlement (coming soon) will be able to skip it. The pill reuses the brand
 * mark (the trophy + magenta gem from `PlatinumMarkIcon`) over the documented
 * ink scrim (`hsl(212 38% 16%)`), with sky-white (`hsl(0 0% 98%)`) text.
 */

/**
 * Brand mark artwork, lifted verbatim from `PlatinumMarkIcon`
 * (viewBox `40 40 433 433`). XML attribute names are kebab-cased because this
 * is rendered by librsvg, not React.
 */
const MARK_VIEWBOX_ORIGIN = 40;
const MARK_VIEWBOX_SIZE = 433;

const MARK_ART = `<g transform="translate(-24 26)"><g transform="translate(-28 26)"><g fill="none" stroke-linecap="round"><path d="M170 176 C 118 182 116 240 176 248" stroke="#192838" stroke-width="40"/><path d="M342 176 C 394 182 396 240 336 248" stroke="#192838" stroke-width="40"/><path d="M170 176 C 118 182 116 240 176 248" stroke="#8FA6C4" stroke-width="16"/><path d="M342 176 C 394 182 396 240 336 248" stroke="#8FA6C4" stroke-width="16"/></g><path d="M234 296h44l-6 48h-32z" fill="#B8CBDE" stroke="#192838" stroke-width="16" stroke-linejoin="round"/><rect x="206" y="342" width="100" height="28" rx="12" fill="#B8CBDE" stroke="#192838" stroke-width="16"/><rect x="182" y="368" width="148" height="34" rx="14" fill="#9FB6CE" stroke="#192838" stroke-width="16"/><path d="M168 150h176v64q0 86-88 86t-88-86z" fill="#DCE6F2" stroke="#192838" stroke-width="16" stroke-linejoin="round"/><rect x="150" y="112" width="212" height="38" rx="19" fill="#DCE6F2" stroke="#192838" stroke-width="16"/></g><g fill="#E0008E"><path d="M408 26 A 70 70 0 0 1 458.72 47.75 L 429.96 84.04 L 412.34 71.38 Z"/><path d="M462.73 52.36 A 70 70 0 0 1 477.34 105.57 L 431.04 105.71 L 429.96 84.04 Z"/><path d="M476.24 111.58 A 70 70 0 0 1 443.75 156.18 L 414.77 120.07 L 431.04 105.71 Z"/><path d="M438.37 159.07 A 70 70 0 0 1 383.24 161.47 L 393.41 116.3 L 414.77 120.07 Z"/><path d="M377.63 159.07 A 70 70 0 0 1 341.37 117.47 L 383.03 97.25 L 393.41 116.3 Z"/><path d="M339.76 111.58 A 70 70 0 0 1 349.68 57.29 L 391.46 77.26 L 383.03 97.25 Z"/><path d="M353.27 52.36 A 70 70 0 0 1 401.9 26.27 L 412.34 71.38 L 391.46 77.26 Z"/></g></g>`;

interface WatermarkPlacement {
  svg: string;
  top: number;
  left: number;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildWatermark(
  imageWidth: number,
  imageHeight: number,
  username: string,
  position: WatermarkPosition = DEFAULT_WATERMARK_POSITION,
): WatermarkPlacement {
  const f = Math.min(1.5, Math.max(0.6, imageWidth / 1600));
  const pad = 11 * f;
  const markSize = 22 * f;
  const titleSize = 13 * f;
  const subSize = 11 * f;
  const gap = 9 * f;
  const lineGap = 3 * f;

  const title = "Platinum Showcase";
  const sub = `@${username}`;
  const titleWidth = title.length * titleSize * 0.6;
  const subWidth = sub.length * subSize * 0.56;
  const textWidth = Math.max(titleWidth, subWidth);

  const textBlock = titleSize + lineGap + subSize;
  const contentWidth = markSize + gap + textWidth;
  const width = Math.ceil(contentWidth + pad * 2);
  const height = Math.ceil(Math.max(markSize, textBlock) + pad * 2);
  const radius = height / 2;

  const blockTop = (height - textBlock) / 2;
  const titleY = blockTop + titleSize / 2;
  const subY = blockTop + titleSize + lineGap + subSize / 2;

  const markScale = markSize / MARK_VIEWBOX_SIZE;
  const markX = pad;
  const markY = height / 2 - markSize / 2;
  const textX = pad + markSize + gap;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="hsl(212 38% 16%)" fill-opacity="0.55"/>
  <g transform="translate(${markX} ${markY}) scale(${markScale}) translate(${-MARK_VIEWBOX_ORIGIN} ${-MARK_VIEWBOX_ORIGIN})">${MARK_ART}</g>
  <text x="${textX}" y="${titleY}" dominant-baseline="middle" font-family="Mulish, 'Segoe UI', 'DejaVu Sans', Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="hsl(0 0% 98%)" fill-opacity="0.95">${escapeXml(title)}</text>
  <text x="${textX}" y="${subY}" dominant-baseline="middle" font-family="Mulish, 'Segoe UI', 'DejaVu Sans', Arial, sans-serif" font-size="${subSize}" font-weight="400" fill="hsl(0 0% 98%)" fill-opacity="0.72">${escapeXml(sub)}</text>
</svg>`;

  const inset = Math.max(pad * 2, imageWidth * 0.025);
  const leftEdge = Math.max(0, Math.round(inset));
  const rightEdge = Math.max(0, Math.round(imageWidth - inset - width));
  const topEdge = Math.max(0, Math.round(inset));
  const bottomEdge = Math.max(0, Math.round(imageHeight - inset - height));

  const left = position.endsWith("left") ? leftEdge : rightEdge;
  const top = position.startsWith("top") ? topEdge : bottomEdge;

  return { svg, top, left };
}

export async function encodePlate(
  resizedBuffer: Buffer,
  username: string,
  watermark: boolean,
  position: WatermarkPosition = DEFAULT_WATERMARK_POSITION,
): Promise<{ data: Buffer; width: number; height: number }> {
  const meta = await sharp(resizedBuffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  let img = sharp(resizedBuffer);
  if (watermark) {
    const { svg, top, left } = buildWatermark(width, height, username, position);
    img = img.composite([{ input: Buffer.from(svg), top, left }]);
  }

  const data = await img.avif({ quality: 60, effort: 4 }).toBuffer();
  return { data, width, height };
}
