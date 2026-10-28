import { NextResponse } from "next/server";
import { isAvatarUserId } from "@/lib/avatar";
import { avatarImageKey, getImage, isStorageConfigured } from "@/lib/b2";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!isAvatarUserId(userId)) {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  if (!isStorageConfigured()) {
    return new NextResponse("Storage not configured", {
      status: 503,
      headers: NO_STORE,
    });
  }

  const image = await getImage(avatarImageKey(userId));
  if (!image) {
    return new NextResponse("Not found", { status: 404, headers: NO_STORE });
  }

  return new NextResponse(image.stream, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": String(image.contentLength),
      // The public URL carries a ?v= stamp that changes on every upload, so a
      // fixed key can still be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
}
