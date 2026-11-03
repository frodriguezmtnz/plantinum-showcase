import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('password reset — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let send: typeof import('@/lib/email/send');
  let reset: typeof import('@/lib/email/password-reset');

  const stamp = Date.now();
  const user = {
    id: `it-reset-${stamp}`,
    email: `it-reset-${stamp}@test.local`,
    username: `it_reset_${stamp}`,
  };

  function issuedToken(): string {
    const entry = send
      .getOutbox()
      .filter((row) => row.kind === 'password-reset')
      .at(-1);
    const match = entry?.text.match(/https?:\/\/\S+reset-password\S*/);
    if (!match) throw new Error('reset link missing from the outbox');
    const token = new URL(match[0]).searchParams.get('token');
    if (!token) throw new Error('token missing from the reset link');
    return token;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.EMAIL_TRANSPORT = 'memory';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9002';

    prisma = (await import('@/lib/prisma')).prisma;
    send = await import('@/lib/email/send');
    reset = await import('@/lib/email/password-reset');

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: 'old-hash',
      },
    });
  });

  beforeEach(async () => {
    send.clearOutbox();
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: 'old-hash', emailVerified: null },
    });
  });

  afterAll(async () => {
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('issues a single-use link for an existing account', async () => {
    const result = await reset.requestPasswordReset(user.email);
    expect(result.sent).toBe(true);

    const outbox = send.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.to).toBe(user.email);
    expect(outbox[0]!.subject).toContain('Reset');

    const token = issuedToken();
    expect(await reset.getPasswordResetState(token)).toBe('valid');
  });

  it('consumes the token, updates the password and verifies the email', async () => {
    await reset.requestPasswordReset(user.email);
    const token = issuedToken();

    const consumed = await reset.consumePasswordReset({
      token,
      passwordHash: 'new-hash',
    });
    expect(consumed.ok).toBe(true);

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, emailVerified: true },
    });
    expect(stored?.passwordHash).toBe('new-hash');
    expect(stored?.emailVerified).toBeInstanceOf(Date);
    expect(await reset.getPasswordResetState(token)).toBe('used');

    const replay = await reset.consumePasswordReset({
      token,
      passwordHash: 'another-hash',
    });
    expect(replay.ok).toBe(false);
  });

  it('replaces the previous link when a second one is requested', async () => {
    await reset.requestPasswordReset(user.email);
    const first = issuedToken();

    await reset.requestPasswordReset(user.email);
    const outbox = send.getOutbox();
    expect(outbox).toHaveLength(2);
    const second = issuedToken();
    expect(second).not.toBe(first);

    expect(await reset.getPasswordResetState(first)).toBe('invalid');
    expect(await reset.getPasswordResetState(second)).toBe('valid');
  });

  it('rejects expired links', async () => {
    await reset.requestPasswordReset(user.email);
    const token = issuedToken();

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'PASSWORD_RESET' },
      data: { expiresAt: new Date(0) },
    });

    expect(await reset.getPasswordResetState(token)).toBe('expired');
    expect(
      (await reset.consumePasswordReset({ token, passwordHash: 'nope' })).ok,
    ).toBe(false);
  });

  it('does not send anything for an unknown address', async () => {
    const result = await reset.requestPasswordReset(`missing-${stamp}@test.local`);
    expect(result.sent).toBe(false);
    expect(send.getOutbox()).toHaveLength(0);
  });

  it('can send the password-changed security notice', async () => {
    await reset.sendPasswordChangedNotice(
      { userId: user.id, email: user.email, username: user.username },
      new Date('2026-01-02T03:04:00.000Z'),
    );
    const outbox = send.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.kind).toBe('password-changed');
    expect(outbox[0]!.text).toContain('2026');
  });
});
