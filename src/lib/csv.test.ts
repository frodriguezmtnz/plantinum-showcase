import { describe, expect, it } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csv', () => {
  it('leaves plain values untouched', () => {
    expect(csvCell('hunter@example.com')).toBe('hunter@example.com');
    expect(csvCell(42)).toBe('42');
    expect(csvCell(null)).toBe('');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('writes a header and rows with a trailing newline', () => {
    expect(
      toCsv(['email', 'domain'], [['a@b.com', 'b.com'], ['x,y@z.com', 'z.com']]),
    ).toBe('email,domain\na@b.com,b.com\n"x,y@z.com",z.com\n');
  });
});
