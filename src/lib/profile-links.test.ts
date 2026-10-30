import { describe, expect, it } from 'vitest';
import {
  legacyProfileLink,
  parseProfileLinks,
  toProfileLinkView,
} from '@/lib/profile-links';

describe('parseProfileLinks', () => {
  it('clears with empty input', () => {
    expect(parseProfileLinks('')).toEqual({ ok: true, links: [] });
  });

  it('validates and builds several providers', () => {
    const result = parseProfileLinks(
      JSON.stringify([
        { provider: 'psnprofiles', handle: 'hunter_1' },
        { provider: 'exophase', handle: 'hunter_1' },
      ]),
    );
    expect(result).toEqual({
      ok: true,
      links: [
        {
          provider: 'psnprofiles',
          handle: 'hunter_1',
          url: 'https://psnprofiles.com/hunter_1',
        },
        {
          provider: 'exophase',
          handle: 'hunter_1',
          url: 'https://www.exophase.com/psn/user/hunter_1/',
        },
      ],
    });
  });

  it('rejects duplicates, bad providers and bad handles', () => {
    expect(
      parseProfileLinks(
        JSON.stringify([
          { provider: 'psnprofiles', handle: 'hunter' },
          { provider: 'psnprofiles', handle: 'other' },
        ]),
      ).ok,
    ).toBe(false);
    expect(
      parseProfileLinks(JSON.stringify([{ provider: 'nope', handle: 'hunter' }]))
        .ok,
    ).toBe(false);
    expect(
      parseProfileLinks(
        JSON.stringify([{ provider: 'psnprofiles', handle: 'has space' }]),
      ).ok,
    ).toBe(false);
    expect(parseProfileLinks('not json').ok).toBe(false);
  });

  it('caps the number of links', () => {
    const providers = [
      'psnprofiles',
      'playstation',
      'psntrophyleaders',
      'pocketpsn',
      'exophase',
      'truetrophies',
      'playstationtrophies',
      'psnprofiles',
    ];
    const result = parseProfileLinks(
      JSON.stringify(providers.map((provider) => ({ provider, handle: 'hunter' }))),
    );
    expect(result.ok).toBe(false);
  });
});

describe('profile link views', () => {
  it('labels stored rows', () => {
    expect(
      toProfileLinkView({
        provider: 'psnprofiles',
        handle: 'hunter',
        url: 'https://psnprofiles.com/hunter',
      }),
    ).toEqual({
      provider: 'psnprofiles',
      handle: 'hunter',
      url: 'https://psnprofiles.com/hunter',
      label: 'PSNProfiles profile hunter',
    });
  });

  it('synthesizes the legacy single link', () => {
    expect(
      legacyProfileLink('https://psnprofiles.com/hunter'),
    ).toMatchObject({
      provider: 'psnprofiles',
      handle: 'hunter',
      label: 'PSNProfiles profile hunter',
    });
    expect(legacyProfileLink(null)).toBeNull();
  });
});
