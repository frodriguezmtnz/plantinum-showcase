/**
 * Bios are public, free-text profile copy. They are rendered as plain text
 * (React escapes them) and never as HTML, but we still strip markup on write so
 * no stored value can surprise a future renderer. Kept isomorphic so the
 * Settings form can share the length cap.
 */

export const BIO_MAX_LENGTH = 160;

const HTML_TAG = /<[^>]*>/g;
// Keep \t (09), \n (0A) and \r (0D); drop the rest of the C0/C1 controls.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeBio(raw: string): string {
  return raw
    .replace(HTML_TAG, ' ')
    .replace(CONTROL_CHARS, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
