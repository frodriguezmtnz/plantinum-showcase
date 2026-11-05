import { describe, expect, it } from 'vitest';
import {
  avatarHue,
  generatedAvatarSvg,
  generatedAvatarUrl,
  initialsFromSeed,
} from './generated-avatar';

describe('generated avatar', () => {
  it('takes the first letter of the first two handle words', () => {
    expect(initialsFromSeed('trophy-hunter-1')).toBe('TH');
    expect(initialsFromSeed('gamer_goddess')).toBe('GG');
    expect(initialsFromSeed('platinum-player')).toBe('PP');
    expect(initialsFromSeed('player')).toBe('P');
  });

  it('falls back to a placeholder for empty seeds', () => {
    expect(initialsFromSeed('')).toBe('P');
    expect(initialsFromSeed(null)).toBe('P');
    expect(initialsFromSeed('   ')).toBe('P');
  });

  it('is deterministic and spreads hues across handles', () => {
    expect(avatarHue('trophy-hunter-1')).toBe(avatarHue('trophy-hunter-1'));
    expect(generatedAvatarSvg('trophy-hunter-1')).toBe(
      generatedAvatarSvg('trophy-hunter-1'),
    );
    expect(avatarHue('trophy-hunter-1')).not.toBe(avatarHue('gamer-goddess'));
  });

  it('builds an encoded, stable URL', () => {
    expect(generatedAvatarUrl('trophy hunter')).toBe(
      '/api/generated-avatars/trophy%20hunter?v=1',
    );
    expect(generatedAvatarUrl('')).toBe('/api/generated-avatars/player?v=1');
  });

  it('renders initials and escapes the seed in the label', () => {
    const svg = generatedAvatarSvg('<script>');

    expect(svg).toContain('&lt;script&gt;');
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('>S</text>');
  });
});
