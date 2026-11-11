import { describe, expect, it } from 'vitest';
import { safeRelativeCallback } from '@/lib/callback-url';

describe('safeRelativeCallback', () => {
  it('keeps same-site relative paths', () => {
    expect(safeRelativeCallback('/explore?source=following')).toBe(
      '/explore?source=following',
    );
    expect(safeRelativeCallback('  /settings  ')).toBe('/settings');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeRelativeCallback('https://evil.test')).toBe('/');
    expect(safeRelativeCallback('//evil.test/path')).toBe('/');
    expect(safeRelativeCallback('javascript:alert(1)')).toBe('/');
  });

  it('falls back for empty values or a custom fallback', () => {
    expect(safeRelativeCallback(undefined)).toBe('/');
    expect(safeRelativeCallback(null)).toBe('/');
    expect(safeRelativeCallback('', '/login')).toBe('/login');
  });
});
