import { describe, expect, it } from 'vitest';
import { detectImageType } from '@/lib/image-signature';

describe('detectImageType', () => {
  it('detects JPEG by its SOI marker', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe('image/jpeg');
  });

  it('detects PNG by the full 8-byte signature', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(detectImageType(png)).toBe('image/png');
  });

  it('detects WebP by RIFF....WEBP', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('WEBP', 'ascii'),
    ]);
    expect(detectImageType(webp)).toBe('image/webp');
  });

  it('rejects a RIFF container that is not WebP', () => {
    const avi = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.from([0x24, 0x00, 0x00, 0x00]),
      Buffer.from('AVI ', 'ascii'),
    ]);
    expect(detectImageType(avi)).toBeNull();
  });

  it('rejects GIF and other unknown bytes', () => {
    expect(detectImageType(Buffer.from('GIF89a', 'ascii'))).toBeNull();
  });

  it('rejects buffers too short to carry a signature', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  it('rejects a near-miss PNG (last byte corrupted)', () => {
    const broken = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x00]);
    expect(detectImageType(broken)).toBeNull();
  });
});
