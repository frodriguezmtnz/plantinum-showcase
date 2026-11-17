import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getImage, isStorageConfigured } from "@/lib/b2";
import { isModerator } from "@/lib/roles";
import { canServeStoredImage } from "@/lib/image-access";
import { pixelateBuffer } from "@/lib/pixelate";
import { getCachedMosaic, setCachedMosaic } from "@/lib/pixelate-cache";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const IMAGE_KEY_PATTERN = /^platinums\/[a-f0-9]{64}\.avif$/;

// Pixelation is a CPU-heavy sharp pipeline plus a B2 read, reachable without a
// session on published plates. Cap it per client and reuse the computed
// mosaic across requests (it only depends on the content hash).
const PIXEL_REQUESTS_PER_MINUTE = 30;
const PIXEL_WINDOW_MS = 60_000;

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

  if (pixelateResponse) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      "local";
    const limit = await checkRateLimit(
      `pixel:${ip}`,
      PIXEL_REQUESTS_PER_MINUTE,
      PIXEL_WINDOW_MS,
    );
    if (!limit.ok) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }
  }

  const image = await getImage(key);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = pixelateResponse ? `"${hash}-pixel"` : `"${hash}"`;

  // Cache headers are shared by 200 and 304: a private response must stay
  // no-store even when the browser already has the bytes.
  const headers: Record<string, string> = {
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

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  let body: BodyInit = image.stream;
  let contentType = image.contentType;
  let contentLength = image.contentLength;

  if (pixelateResponse) {
    let mosaic = getCachedMosaic(hash);
    if (!mosaic) {
      const buffer = Buffer.from(await new Response(image.stream).arrayBuffer());
      mosaic = (await pixelateBuffer(buffer)) ?? undefined;
      if (!mosaic) {
        return new NextResponse("Not found", { status: 404 });
      }
      setCachedMosaic(hash, mosaic);
    }
    body = new Uint8Array(mosaic);
    contentType = "image/avif";
    contentLength = mosaic.byteLength;
  }

  headers["Content-Type"] = contentType;
  if (contentLength > 0) {
    headers["Content-Length"] = String(contentLength);
  }

  return new NextResponse(body, { headers });
}
