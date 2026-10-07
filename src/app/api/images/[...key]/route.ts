import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getImage, isStorageConfigured } from "@/lib/b2";
import { isModerator } from "@/lib/roles";
import { canServeStoredImage } from "@/lib/image-access";

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
  const viewerIsModerator =
    viewerId && !isPublic ? await isModerator(viewerId) : false;

  if (
    !canServeStoredImage(plates, {
      id: viewerId,
      isModerator: viewerIsModerator,
    })
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  const image = await getImage(key);
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
  }

  const etag = `"${hash}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  const headers: Record<string, string> = {
    "Content-Type": image.contentType,
    "Cache-Control": isPublic
      ? "public, max-age=31536000, immutable"
      : "private, no-store",
    "Content-Disposition": "inline",
    ETag: etag,
  };
  if (!isPublic) {
    headers["Vary"] = "Cookie";
  }
  if (image.contentLength > 0) {
    headers["Content-Length"] = String(image.contentLength);
  }

  return new NextResponse(image.stream, { headers });
}
