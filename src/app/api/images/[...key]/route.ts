import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getImage, isStorageConfigured } from "@/lib/b2";
import { isModerator } from "@/lib/roles";
import { canServeStoredImage } from "@/lib/image-access";
import { pixelateBuffer } from "@/lib/pixelate";

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

  const hash = key.slice("platinums/".length, -".avif".length);
  const plates = await prisma.platinum.findMany({
    where: { hash },
    select: { userId: true, moderationStatus: true },
  });

  const session = await auth();
  const viewerId = session?.user?.id;
  const isPublic = plates.some(
    (plate) => plate.moderationStatus === "PUBLISHED",
  );

  const wantsPixel = request.nextUrl.searchParams.get("fx") === "pixel";
  // The moderator lookup is a DB round-trip, so it only runs when it can
  // change the outcome: a plate that is not public, or a pixelated request.
  const viewerIsModerator =
    viewerId && (!isPublic || wantsPixel) ? await isModerator(viewerId) : false;

  if (
    !canServeStoredImage(plates, {
      id: viewerId,
      isModerator: viewerIsModerator,
    })
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Moderators always keep the untouched screenshot so they can judge it.
  const pixelateResponse = wantsPixel && !viewerIsModerator;

  const image = await getImage(key);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = pixelateResponse ? `"${hash}-pixel"` : `"${hash}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  let body: BodyInit = image.stream;
  let contentType = image.contentType;
  let contentLength = image.contentLength;

  if (pixelateResponse) {
    const buffer = Buffer.from(await new Response(image.stream).arrayBuffer());
    const mosaic = await pixelateBuffer(buffer);
    if (!mosaic) {
      return new NextResponse("Not found", { status: 404 });
    }
    body = new Uint8Array(mosaic);
    contentType = "image/avif";
    contentLength = mosaic.byteLength;
  }

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": isPublic
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
    "Content-Disposition": "inline",
    "X-Robots-Tag": "noindex",
    ETag: etag,
  };
  if (!isPublic) {
    headers["Vary"] = "Cookie";
  }
  if (contentLength > 0) {
    headers["Content-Length"] = String(contentLength);
  }

  return new NextResponse(body, { headers });
}
