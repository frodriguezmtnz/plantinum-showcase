import { domainToASCII } from 'node:url';
import { isDisposableEmail } from './domains';

export const EMAIL_FORMAT_ERROR = 'That email address is not valid.';
export const DISPOSABLE_EMAIL_ERROR =
  'Please use a permanent email address. Disposable or temporary inboxes are not allowed.';

export function normalizeEmail(value: string): string {
  return (value ?? '').trim().toLowerCase();
}

function validDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;

  const ascii = domainToASCII(domain);
  if (!ascii) return false;

  const labels = ascii.split('.');
  if (labels.length < 2) return false;

  return labels.every(
    (label) =>
      label.length > 0 &&
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  );
}

/** Shape/length check only. Disposable-domain rejection happens at signup. */
export function emailFormatProblem(email: string): string | null {
  if (!email || email.length > 254) return EMAIL_FORMAT_ERROR;

  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) return EMAIL_FORMAT_ERROR;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!/^[^\s@]+$/.test(local)) return EMAIL_FORMAT_ERROR;
  if (!validDomain(domain)) return EMAIL_FORMAT_ERROR;

  return null;
}

/**
 * Registration-only guard: format plus the disposable-domain blocklist. Never
 * applied to login/reset so an address that joins the list later cannot lock a
 * real account out.
 */
export async function registrationEmailProblem(
  email: string,
): Promise<string | null> {
  const format = emailFormatProblem(email);
  if (format) return format;

  return (await isDisposableEmail(email)) ? DISPOSABLE_EMAIL_ERROR : null;
}
