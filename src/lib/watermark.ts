import sharp from "sharp";

/**
 * Baked-in site watermark. Free accounts always get it; the Pro/Supporter
 * entitlement (coming soon) will be able to skip it. Colors reuse documented
 * tokens — ink (`hsl(212 38% 16%)`) scrim and sky-white (`hsl(0 0% 98%)`)
 * text — so the world stays honest.
 */

const STAR_PATH =
  "M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.57L12 17.57l-5.9 3.1 1.13-6.57-4.78-4.66 6.6-.96z";

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
): WatermarkPlacement {
  const f = Math.min(1.5, Math.max(0.6, imageWidth / 1600));
  const pad = 11 * f;
  const starSize = 16 * f;
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
  const contentWidth = starSize + gap + textWidth;
  const width = Math.ceil(contentWidth + pad * 2);
  const height = Math.ceil(Math.max(starSize, textBlock) + pad * 2);
  const radius = height / 2;

  const blockTop = (height - textBlock) / 2;
  const titleY = blockTop + titleSize / 2;
  const subY = blockTop + titleSize + lineGap + subSize / 2;
  const starScale = starSize / 24;
  const starX = pad;
  const starY = height / 2 - starSize / 2;
  const textX = pad + starSize + gap;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="hsl(212 38% 16%)" fill-opacity="0.55"/>
  <g transform="translate(${starX} ${starY}) scale(${starScale})">
    <path d="${STAR_PATH}" fill="hsl(0 0% 98%)" fill-opacity="0.92"/>
  </g>
  <text x="${textX}" y="${titleY}" dominant-baseline="middle" font-family="Mulish, 'Segoe UI', 'DejaVu Sans', Arial, sans-serif" font-size="${titleSize}" font-weight="700" fill="hsl(0 0% 98%)" fill-opacity="0.95">${escapeXml(title)}</text>
  <text x="${textX}" y="${subY}" dominant-baseline="middle" font-family="Mulish, 'Segoe UI', 'DejaVu Sans', Arial, sans-serif" font-size="${subSize}" font-weight="400" fill="hsl(0 0% 98%)" fill-opacity="0.72">${escapeXml(sub)}</text>
</svg>`;

  const inset = Math.max(pad * 2, imageWidth * 0.025);
  const left = Math.max(0, Math.round(imageWidth - inset - width));
  const top = Math.max(0, Math.round(imageHeight - inset - height));

  return { svg, top, left };
}

export async function applyWatermark(
  resizedBuffer: Buffer,
  username: string,
): Promise<{ data: Buffer; width: number; height: number }> {
  const meta = await sharp(resizedBuffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const { svg, top, left } = buildWatermark(width, height, username);

  const data = await sharp(resizedBuffer)
    .composite([{ input: Buffer.from(svg), top, left }])
    .avif({ quality: 60, effort: 4 })
    .toBuffer();

  return { data, width, height };
}
