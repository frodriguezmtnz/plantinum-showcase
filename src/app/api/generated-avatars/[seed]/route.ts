import { NextResponse } from 'next/server';
import { generatedAvatarSvg } from '@/lib/generated-avatar';

export const runtime = 'nodejs';

const CACHE = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Content-Type': 'image/svg+xml; charset=utf-8',
  'X-Robots-Tag': 'noindex',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ seed: string }> },
) {
  const { seed } = await params;

  return new NextResponse(generatedAvatarSvg(seed), { headers: CACHE });
}
