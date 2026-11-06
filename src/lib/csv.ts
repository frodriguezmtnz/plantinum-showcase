/** Minimal RFC 4180-style CSV writer: quotes commas, quotes and newlines. */
export function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n')
    .concat('\n');
}
