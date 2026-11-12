import { getSiteUrl } from '@/lib/site';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LayoutInput {
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  outro: string;
  preheader?: string;
}

/**
 * Plain, inline-styled HTML + text version. No remote images so the message
 * works in dark clients and doesn't depend on the site being reachable.
 */
function renderEmail({
  heading,
  intro,
  ctaLabel,
  ctaUrl,
  outro,
  preheader,
}: LayoutInput): { html: string; text: string } {
  const safeHeading = escapeHtml(heading);
  const safeIntro = escapeHtml(intro);
  const safeOutro = escapeHtml(outro);
  const safeCta = escapeHtml(ctaLabel);
  const safeUrl = escapeHtml(ctaUrl);
  const safePreheader = escapeHtml(preheader ?? intro);
  const footer =
    'You received this email because this address was used on Platinum Showcase. If it was not you, you can ignore it.';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f1ee;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f1ee;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e0d8;border-radius:16px;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 24px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b45309;">Platinum Showcase</p>
                <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#111827;">${safeHeading}</h1>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;">${safeIntro}</p>
                <p style="margin:28px 0;text-align:center;">
                  <a href="${safeUrl}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#111827;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${safeCta}</a>
                </p>
                <p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:#6b7280;">If the button does not work, paste this link into your browser:</p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#6b7280;word-break:break-all;">${safeUrl}</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">${safeOutro}</p>
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:16px auto 0;font-size:11px;line-height:1.5;color:#9ca3af;text-align:center;">${escapeHtml(footer)}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${heading}

${intro}

${ctaLabel}: ${ctaUrl}

${outro}

--
${footer}`;

  return { html, text };
}

function displayName(username: string | null | undefined): string {
  return username?.trim() || 'trophy hunter';
}

function formatUtc(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function passwordResetEmail({
  username,
  url,
  expiresMinutes = 60,
}: {
  username: string | null | undefined;
  url: string;
  expiresMinutes?: number;
}): EmailTemplate {
  const { html, text } = renderEmail({
    heading: 'Reset your password',
    intro: `Hi ${displayName(username)}, someone asked to reset the password for your Platinum Showcase account.`,
    ctaLabel: 'Choose a new password',
    ctaUrl: url,
    outro: `This link expires in ${expiresMinutes} minutes and can only be used once. If you did not ask for it, ignore this email; your password will not change.`,
    preheader: 'Reset your Platinum Showcase password.',
  });

  return {
    subject: 'Reset your Platinum Showcase password',
    html,
    text,
  };
}

export function verifyEmailEmail({
  username,
  url,
  expiresHours = 24,
}: {
  username: string | null | undefined;
  url: string;
  expiresHours?: number;
}): EmailTemplate {
  const { html, text } = renderEmail({
    heading: 'Verify your email',
    intro: `Hi ${displayName(username)}, confirm this address to unlock uploading, voting and following on Platinum Showcase.`,
    ctaLabel: 'Verify my email',
    ctaUrl: url,
    outro: `This link expires in ${expiresHours} hours and can only be used once. If you did not create this account, you can ignore this email.`,
    preheader: 'Confirm your email to unlock Platinum Showcase.',
  });

  return {
    subject: 'Verify your email for Platinum Showcase',
    html,
    text,
  };
}

export function passwordChangedEmail({
  username,
  changedAt,
}: {
  username: string | null | undefined;
  changedAt: Date;
}): EmailTemplate {
  const when = formatUtc(changedAt);
  const resetUrl = `${getSiteUrl()}/forgot-password`;

  const { html, text } = renderEmail({
    heading: 'Your password changed',
    intro: `Hi ${displayName(username)}, the password for your Platinum Showcase account was changed on ${when} UTC.`,
    ctaLabel: 'Reset it again',
    ctaUrl: resetUrl,
    outro:
      'If you made this change, no action is needed. If it was not you, reset your password now and check your account.',
    preheader: 'Your Platinum Showcase password changed.',
  });

  return {
    subject: 'Your Platinum Showcase password changed',
    html,
    text,
  };
}

/** Sent to the address the account wants to switch to. */
export function emailChangeConfirmEmail({
  username,
  url,
  expiresMinutes = 30,
}: {
  username: string | null | undefined;
  url: string;
  expiresMinutes?: number;
}): EmailTemplate {
  const { html, text } = renderEmail({
    heading: 'Confirm your new email',
    intro: `Hi ${displayName(username)}, confirm this address to make it the sign-in email for your Platinum Showcase account.`,
    ctaLabel: 'Confirm new email',
    ctaUrl: url,
    outro: `This link expires in ${expiresMinutes} minutes and can only be used once. Your current address keeps working until you confirm. If you did not ask for this, ignore the email and your address will not change.`,
    preheader: 'Confirm your new Platinum Showcase email.',
  });

  return {
    subject: 'Confirm your new Platinum Showcase email',
    html,
    text,
  };
}

/** Security notice sent to the current address when the change is requested. */
export function emailChangeRequestedEmail({
  username,
  newEmail,
  requestedAt,
}: {
  username: string | null | undefined;
  newEmail: string;
  requestedAt: Date;
}): EmailTemplate {
  const when = formatUtc(requestedAt);
  const { html, text } = renderEmail({
    heading: 'Email change requested',
    intro: `Hi ${displayName(username)}, someone asked to move your Platinum Showcase account to ${newEmail} on ${when} UTC. Your current address still works until the new one is confirmed.`,
    ctaLabel: 'Secure my account',
    ctaUrl: `${getSiteUrl()}/forgot-password`,
    outro:
      'If this was you, no action is needed. If it was not, reset your password now and review your account.',
    preheader: 'An email change was requested on your Platinum Showcase account.',
  });

  return {
    subject: 'Email change requested for Platinum Showcase',
    html,
    text,
  };
}

/** Sent to the old address once the switch is confirmed. */
export function emailChangedEmail({
  username,
  newEmail,
  changedAt,
}: {
  username: string | null | undefined;
  newEmail: string;
  changedAt: Date;
}): EmailTemplate {
  const when = formatUtc(changedAt);
  const { html, text } = renderEmail({
    heading: 'Your email changed',
    intro: `Hi ${displayName(username)}, the email on your Platinum Showcase account changed to ${newEmail} on ${when} UTC.`,
    ctaLabel: 'Secure my account',
    ctaUrl: `${getSiteUrl()}/forgot-password`,
    outro:
      'If you made this change, no action is needed. If it was not you, reset your password now and check your account.',
    preheader: 'Your Platinum Showcase email changed.',
  });

  return {
    subject: 'Your Platinum Showcase email changed',
    html,
    text,
  };
}

/** Confirmation sent to the new address after the switch. */
export function emailChangeActiveEmail({
  username,
  changedAt,
}: {
  username: string | null | undefined;
  changedAt: Date;
}): EmailTemplate {
  const when = formatUtc(changedAt);
  const { html, text } = renderEmail({
    heading: 'Your new email is active',
    intro: `Hi ${displayName(username)}, this address is now the sign-in email for your Platinum Showcase account as of ${when} UTC.`,
    ctaLabel: 'Go to Settings',
    ctaUrl: `${getSiteUrl()}/settings`,
    outro:
      'If you did not make this change, reset your password and review your account.',
    preheader: 'Your new Platinum Showcase email is active.',
  });

  return {
    subject: 'Your new Platinum Showcase email is active',
    html,
    text,
  };
}

/**
 * Sent to accounts without a password (Google sign-ups) as the step-up for a
 * deletion: the link opens a danger page that performs the irreversible work.
 */
export function accountDeleteConfirmEmail({
  username,
  url,
  expiresMinutes = 30,
}: {
  username: string | null | undefined;
  url: string;
  expiresMinutes?: number;
}): EmailTemplate {
  const { html, text } = renderEmail({
    heading: 'Confirm account deletion',
    intro: `Hi ${displayName(username)}, someone asked to permanently delete your Platinum Showcase account, its platinums and uploaded images. The link below is the only confirmation step.`,
    ctaLabel: 'Review and delete my account',
    ctaUrl: url,
    outro: `This link expires in ${expiresMinutes} minutes and can only be used once. If you did not ask for this, ignore the email and your account stays exactly as it is.`,
    preheader: 'Confirm the deletion of your Platinum Showcase account.',
  });

  return {
    subject: 'Confirm the deletion of your Platinum Showcase account',
    html,
    text,
  };
}

/** Best-effort record sent after the account and its plates are gone. */
export function accountDeletedEmail({
  username,
  deletedAt,
}: {
  username: string | null | undefined;
  deletedAt: Date;
}): EmailTemplate {
  const when = formatUtc(deletedAt);
  const { html, text } = renderEmail({
    heading: 'Your account was deleted',
    intro: `Hi ${displayName(username)}, your Platinum Showcase account, its platinums and uploaded images were permanently deleted on ${when} UTC.`,
    ctaLabel: 'Back to the showcase',
    ctaUrl: getSiteUrl(),
    outro:
      'This message is your record of the deletion; nothing further is needed. Deleted accounts and plates cannot be restored.',
    preheader: 'Your Platinum Showcase account was deleted.',
  });

  return {
    subject: 'Your Platinum Showcase account was deleted',
    html,
    text,
  };
}
