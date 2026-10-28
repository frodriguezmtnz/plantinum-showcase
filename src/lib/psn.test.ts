import { describe, expect, it } from 'vitest';
import { parsePsnProfileUrl } from '@/lib/psn';

describe('parsePsnProfileUrl', () => {
  it('clears on empty input', () => {
    expect(parsePsnProfileUrl('   ')).toEqual({ ok: true, url: null });
  });

  it('accepts psnprofiles and playstation links (and subdomains)', () => {
    expect(parsePsnProfileUrl('https://psnprofiles.com/hunter')).toEqual({
      ok: true,
      url: 'https://psnprofiles.com/hunter',
    });
    expect(
      parsePsnProfileUrl('https://my.playstation.com/profile/hunter'),
    ).toEqual({ ok: true, url: 'https://my.playstation.com/profile/hunter' });
  });

  it('rejects other hosts, http and credentials', () => {
    expect(parsePsnProfileUrl('https://example.com/hunter')).toEqual({
      ok: false,
      reason: 'host',
    });
    expect(parsePsnProfileUrl('http://psnprofiles.com/hunter')).toEqual({
      ok: false,
      reason: 'protocol',
    });
    expect(
      parsePsnProfileUrl('https://user:pass@psnprofiles.com/hunter'),
    ).toEqual({ ok: false, reason: 'invalid' });
    expect(parsePsnProfileUrl('not a url')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });
});
