import { describe, expect, it } from 'vitest';
import {
  buildPsnProfileUrl,
  describePsnProfile,
  parsePsnProfileUrl,
  psnHandleProblem,
  PSN_PROVIDERS,
} from '@/lib/psn';

describe('parsePsnProfileUrl', () => {
  it('clears on empty input', () => {
    expect(parsePsnProfileUrl('   ')).toEqual({ ok: true, url: null });
  });

  it('accepts every supported host (including subdomains)', () => {
    expect(parsePsnProfileUrl('https://psnprofiles.com/hunter')).toEqual({
      ok: true,
      url: 'https://psnprofiles.com/hunter',
    });
    expect(
      parsePsnProfileUrl('https://my.playstation.com/profile/hunter'),
    ).toEqual({ ok: true, url: 'https://my.playstation.com/profile/hunter' });
    expect(
      parsePsnProfileUrl('https://www.exophase.com/psn/user/hunter/'),
    ).toEqual({
      ok: true,
      url: 'https://www.exophase.com/psn/user/hunter/',
    });
    expect(
      parsePsnProfileUrl('https://pocketpsn.com/hunter'),
    ).toEqual({ ok: true, url: 'https://pocketpsn.com/hunter' });
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
  it.each([
    [
      'https://psnprofiles.com/Trophy_Hunter/',
      'PSNProfiles profile Trophy_Hunter',
      'psnprofiles',
      'Trophy_Hunter',
    ],
    [
      'https://profile.playstation.com/hunter',
      'PlayStation profile',
      'playstation',
      'hunter',
    ],
    [
      'https://my.playstation.com/profile/hunter',
      'PlayStation profile',
      'playstation',
      'hunter',
    ],
    [
      'https://psntrophyleaders.com/user/view/hunter',
      'PSNTrophyLeaders profile hunter',
      'psntrophyleaders',
      'hunter',
    ],
    [
      'https://pocketpsn.com/hunter',
      'PocketPSN profile hunter',
      'pocketpsn',
      'hunter',
    ],
    [
      'https://www.exophase.com/psn/user/hunter/',
      'Exophase profile hunter',
      'exophase',
      'hunter',
    ],
    [
      'https://www.truetrophies.com/gamer/hunter',
      'TrueTrophies profile hunter',
      'truetrophies',
      'hunter',
    ],
    [
      'https://www.playstationtrophies.org/profiles/hunter',
      'PlayStationTrophies.org profile hunter',
      'playstationtrophies',
      'hunter',
    ],
  ])('labels %s', (url, label, kind, handle) => {
    expect(describePsnProfile(url)).toEqual({ label, kind, handle });
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

  it('builds the profile URL for every provider', () => {
    const expected = {
      psnprofiles: 'https://psnprofiles.com/hunter_1',
      playstation: 'https://profile.playstation.com/hunter_1',
      psntrophyleaders: 'https://psntrophyleaders.com/user/view/hunter_1',
      pocketpsn: 'https://pocketpsn.com/hunter_1',
      exophase: 'https://www.exophase.com/psn/user/hunter_1/',
      truetrophies: 'https://www.truetrophies.com/gamer/hunter_1',
      playstationtrophies:
        'https://www.playstationtrophies.org/profiles/hunter_1',
    } as const;

    for (const provider of PSN_PROVIDERS) {
      expect(buildPsnProfileUrl(provider.value, 'hunter_1')).toBe(
        expected[provider.value],
      );
    }
    expect(PSN_PROVIDERS).toHaveLength(7);
  });
});
