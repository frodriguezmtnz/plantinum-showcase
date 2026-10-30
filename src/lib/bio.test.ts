import { describe, expect, it } from 'vitest';
import { bioProblem, sanitizeBio } from '@/lib/bio';

describe('sanitizeBio', () => {
  it('strips HTML tags so stored bios are plain text', () => {
    const bio = sanitizeBio('<img src=x onerror=alert(1)>Trophy hunter');
    expect(bio).toBe('Trophy hunter');
    expect(bio).not.toContain('<');
    expect(bio).not.toContain('>');
  });

  it('drops script tags but keeps their text', () => {
    expect(sanitizeBio('Hello <script>alert(1)</script> world')).toBe(
      'Hello alert(1) world',
    );
  });

  it('keeps paragraph breaks but collapses runs', () => {
    expect(sanitizeBio('Line one\n\n\n\nLine two')).toBe('Line one\n\nLine two');
  });

  it('removes control characters and trims', () => {
    expect(sanitizeBio('  a\u0000b\u0007c  ')).toBe('abc');
  });
});

describe('bioProblem', () => {
  it('rejects angle brackets and javascript', () => {
    expect(bioProblem('hard trophy hunter <img src=x>')).toBe('html');
    expect(bioProblem('javascript:alert(1)')).toBe('script');
    expect(bioProblem('hard trophy hunter')).toBeNull();
  });
});
