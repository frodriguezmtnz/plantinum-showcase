import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isRawgConfigured, searchGamesWithStatus } from '@/lib/rawg';

export const dynamic = 'force-dynamic';

const MAX_QUERY_LENGTH = 80;

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (
    forwarded?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'local'
  );
}

/**
 * Server-side proxy for RAWG autocomplete. The API key never reaches the
 * browser, and a missing key simply returns an empty list (the form keeps its
 * free-text fallback).
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (query.length < 2) {
    return NextResponse.json({ results: [], configured: isRawgConfigured() });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { results: [], error: 'That search is too long.' },
      { status: 400 },
    );
  }
  if (!isRawgConfigured()) {
    return NextResponse.json({ results: [], configured: false });
  }

  const limit = await checkRateLimit(`games:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        results: [],
        configured: true,
        available: false,
        error: 'Too many searches. Please wait a moment.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      },
    );
  }

  const { results, ok } = await searchGamesWithStatus(query);
  return NextResponse.json(
    { results, configured: true, available: ok },
    {
      headers: {
        // Never let a CDN cache an upstream outage as "no matches".
        'Cache-Control': ok
          ? 'public, max-age=300, s-maxage=86400'
          : 'no-store',
      },
    },
  );
}
