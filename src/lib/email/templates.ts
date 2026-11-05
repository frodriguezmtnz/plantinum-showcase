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
  const when = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(changedAt);
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
