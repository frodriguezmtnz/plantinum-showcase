import { NextRequest, NextResponse } from "next/server";
import { getImage, isStorageConfigured } from "@/lib/b2";

export const runtime = "nodejs";

const IMAGE_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  if (!IMAGE_KEY_PATTERN.test(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isStorageConfigured()) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  const image = await getImage(key);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const hash = key.slice("platinums/".length, -".avif".length);
  const etag = `"${hash}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const headers: Record<string, string> = {
    "Content-Type": image.contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": "inline",
    ETag: etag,
  };
  if (image.contentLength > 0) {
    headers["Content-Length"] = String(image.contentLength);
  }

  return new NextResponse(image.stream, { headers });
}
