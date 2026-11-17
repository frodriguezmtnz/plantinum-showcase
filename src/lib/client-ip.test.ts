import { describe, expect, it } from 'vitest';
import { getClientIp } from '@/lib/client-ip';

function headersWith(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe('getClientIp', () => {
  it('returns the single forwarded value', () => {
    expect(
      getClientIp(headersWith({ 'x-forwarded-for': '203.0.113.7' })),
    ).toBe('203.0.113.7');
  });

  it('takes the rightmost hop so spoofed entries cannot win', () => {
    expect(
      getClientIp(
        headersWith({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7' }),
      ),
    ).toBe('203.0.113.7');
  });

  it('trims whitespace around every hop', () => {
    expect(
      getClientIp(headersWith({ 'x-forwarded-for': '  1.2.3.4 ,  203.0.113.7  ' })),
    ).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip when the forwarded header is empty', () => {
    expect(
      getClientIp(
        headersWith({
          'x-forwarded-for': '',
          'x-real-ip': '198.51.100.2',
        }),
      ),
    ).toBe('198.51.100.2');
    expect(
      getClientIp(headersWith({ 'x-real-ip': '198.51.100.2' })),
    ).toBe('198.51.100.2');
  });

  it('returns "local" when no proxy headers are present', () => {
    expect(getClientIp(headersWith({}))).toBe('local');
  });
});
