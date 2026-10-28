import { NextResponse } from "next/server";
import { avatarImageKey, getImage, isStorageConfigured } from "@/lib/b2";

export const runtime = "nodejs";

// cuid() ids are lowercase alphanumerics; reject anything else before touching
// storage so the route cannot be used to probe arbitrary keys.
const USER_ID_PATTERN = /^[a-z0-9]{20,40}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  if (!USER_ID_PATTERN.test(userId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isStorageConfigured()) {
    return new NextResponse("Storage not configured", { status: 503 });
  }

  const image = await getImage(avatarImageKey(userId));
  if (!image) {
    return new NextResponse("Not found", { status: 404 });
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
