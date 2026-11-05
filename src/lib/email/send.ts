import nodemailer, { type Transporter } from 'nodemailer';

export type EmailKind = 'password-reset' | 'email-verify' | 'password-changed';

export interface EmailMessage {
  kind: EmailKind;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export interface SendResult {
  ok: boolean;
  id?: string;
  previewUrl?: string;
  error?: string;
}

export interface OutboxEntry extends EmailMessage {
  at: string;
}

type TransportKind = 'smtp' | 'ethereal' | 'console' | 'memory';

const outbox: OutboxEntry[] = [];

/** Test hook: the messages the memory transport would have sent. */
export function getOutbox(): OutboxEntry[] {
  return [...outbox];
}

export function clearOutbox(): void {
  outbox.length = 0;
}

function transportKind(): TransportKind {
  const explicit = process.env.EMAIL_TRANSPORT?.trim().toLowerCase();
  if (
    explicit === 'smtp' ||
    explicit === 'ethereal' ||
    explicit === 'console' ||
    explicit === 'memory'
  ) {
    return explicit;
  }
  if (explicit) {
    console.warn(`[email] unknown EMAIL_TRANSPORT "${explicit}", falling back`);
  }
  return process.env.EMAIL_SMTP_HOST &&
    process.env.EMAIL_SMTP_USER &&
    process.env.EMAIL_SMTP_PASS
    ? 'smtp'
    : 'console';
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || 'Platinum Showcase <no-reply@localhost>';
}

let smtpTransport: Transporter | null = null;

function getSmtpTransport(): Transporter {
  if (smtpTransport) return smtpTransport;

  const host = process.env.EMAIL_SMTP_HOST?.trim();
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      'EMAIL_SMTP_HOST, EMAIL_SMTP_USER and EMAIL_SMTP_PASS are required for SMTP',
    );
  }

  const port = Number(process.env.EMAIL_SMTP_PORT ?? 587);
  smtpTransport = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: (Number.isFinite(port) ? port : 587) === 465,
    auth: { user, pass },
  });
  return smtpTransport;
}

let etherealTransport: Promise<Transporter> | null = null;

function getEtherealTransport(): Promise<Transporter> {
  if (!etherealTransport) {
    etherealTransport = nodemailer.createTestAccount().then((account) =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      }),
    );
  }
  return etherealTransport;
}

/**
 * Sends an email and never throws: a broken transport must not roll back the
 * action that triggered it. Tokens are intentionally not logged.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const kind = transportKind();

  if (kind === 'memory') {
    outbox.push({ ...message, at: new Date().toISOString() });
    return { ok: true, id: `memory-${outbox.length}` };
  }

  if (kind === 'console') {
    console.info(
      `[email:console] kind=${message.kind} to=${message.to} subject="${message.subject}"`,
    );
    console.info(message.text);
    return { ok: true };
  }

  try {
    const transporter =
      kind === 'smtp' ? getSmtpTransport() : await getEtherealTransport();
    const info = await transporter.sendMail({
      from: fromAddress(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo ?? (process.env.EMAIL_REPLY_TO?.trim() || undefined),
    });

    const previewUrl =
      kind === 'ethereal'
        ? nodemailer.getTestMessageUrl(info) || undefined
        : undefined;
    if (previewUrl) console.info(`[email] preview: ${previewUrl}`);

    return { ok: true, id: info.messageId, previewUrl };
  } catch (error) {
    console.error('[email] send failed', {
      kind: message.kind,
      to: message.to,
      error,
    });
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
