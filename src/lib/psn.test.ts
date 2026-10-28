import { describe, expect, it } from 'vitest';
import {
  buildPsnProfileUrl,
  describePsnProfile,
  parsePsnProfileUrl,
  psnHandleProblem,
} from '@/lib/psn';

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

describe('describePsnProfile', () => {
  it('names the PSNProfiles handle from the path', () => {
    expect(describePsnProfile('https://psnprofiles.com/Trophy_Hunter/')).toEqual(
      {
        label: 'PSNProfiles profile Trophy_Hunter',
        kind: 'psnprofiles',
        handle: 'Trophy_Hunter',
      },
    );
    expect(
      describePsnProfile('https://www.psnprofiles.com/Trophy%20Hunter'),
    ).toEqual({
      label: 'PSNProfiles profile Trophy Hunter',
      kind: 'psnprofiles',
      handle: 'Trophy Hunter',
    });
  });

  it('uses a generic label for PlayStation', () => {
    expect(
      describePsnProfile('https://profile.playstation.com/hunter'),
    ).toEqual({
      label: 'PlayStation profile',
      kind: 'playstation',
      handle: 'hunter',
    });
    expect(
      describePsnProfile('https://my.playstation.com/profile/hunter'),
    ).toEqual({
      label: 'PlayStation profile',
      kind: 'playstation',
      handle: 'hunter',
    });
  });

  it('returns null for empty or unknown URLs', () => {
    expect(describePsnProfile(null)).toBeNull();
    expect(describePsnProfile('')).toBeNull();
    expect(describePsnProfile('https://example.com/x')).toBeNull();
  });
});

describe('PSN nickname handling', () => {
  it('validates PSN online IDs', () => {
    expect(psnHandleProblem('hunter_1')).toBeNull();
    expect(psnHandleProblem('ab')).toBe('invalid');
    expect(psnHandleProblem('has space')).toBe('invalid');
    expect(psnHandleProblem('a'.repeat(17))).toBe('invalid');
    expect(psnHandleProblem('   ')).toBe('empty');
  });

  it('builds the profile URL for each provider', () => {
    expect(buildPsnProfileUrl('psnprofiles', 'hunter_1')).toBe(
      'https://psnprofiles.com/hunter_1',
    );
    expect(buildPsnProfileUrl('playstation', 'hunter_1')).toBe(
      'https://profile.playstation.com/hunter_1',
    );
  });
});
