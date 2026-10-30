import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from '@/lib/json-ld';

describe('serializeJsonLd', () => {
  it('escapes < so user text cannot close the script tag', () => {
    const serialized = serializeJsonLd({
      description: 'Hi </script><script>alert(1)</script>',
    });
    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script');
  });

  it('keeps ordinary values intact', () => {
    expect(serializeJsonLd({ name: 'Hunter', tags: ['PS5'] })).toBe(
      '{"name":"Hunter","tags":["PS5"]}',
    );
  });
});
