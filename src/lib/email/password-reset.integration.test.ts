import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

const PASSWORDS = {
  current: 'Current!Passw0rd123',
  previousNewer: 'Previous!Newer12345',
  previousOlder: 'Previous!Older12345',
  fresh: 'Fresh!Passw0rd1234',
  other: 'Other!Passw0rd12345',
};

describe.skipIf(!url)('password reset — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let send: typeof import('@/lib/email/send');
  let reset: typeof import('@/lib/email/password-reset');
  let currentHash = '';

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
    currentHash = await bcrypt.hash(PASSWORDS.current, 10);

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: currentHash,
      },
    });
  });

  beforeEach(async () => {
    send.clearOutbox();
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordHistory.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: currentHash, emailVerified: null, sessionVersion: 0 },
    });
  });

  afterAll(async () => {
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordHistory.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  async function seedPreviousPasswords() {
    const now = Date.now();
    await prisma.passwordHistory.createMany({
      data: [
        {
          userId: user.id,
          passwordHash: await bcrypt.hash(PASSWORDS.previousOlder, 10),
          createdAt: new Date(now - 60_000),
        },
        {
          userId: user.id,
          passwordHash: await bcrypt.hash(PASSWORDS.previousNewer, 10),
          createdAt: new Date(now - 30_000),
        },
      ],
    });
  }

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
      password: PASSWORDS.fresh,
    });
    expect(consumed.ok).toBe(true);

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, emailVerified: true, sessionVersion: true },
    });
    // The bump revokes every JWT issued before the reset.
    expect(stored?.sessionVersion).toBe(1);
    expect(stored?.passwordHash).toBeTruthy();
    expect(await bcrypt.compare(PASSWORDS.fresh, stored!.passwordHash!)).toBe(
      true,
    );
    expect(stored?.emailVerified).toBeInstanceOf(Date);
    expect(await reset.getPasswordResetState(token)).toBe('used');

    // The replaced hash is kept so it cannot be reused right away.
    const history = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      select: { passwordHash: true },
    });
    expect(history).toHaveLength(1);
    expect(await bcrypt.compare(PASSWORDS.current, history[0]!.passwordHash)).toBe(
      true,
    );

    const replay = await reset.consumePasswordReset({
      token,
      password: PASSWORDS.other,
    });
    expect(replay.ok).toBe(false);
  });

  it('rejects the current password without burning the link', async () => {
    await reset.requestPasswordReset(user.email);
    const token = issuedToken();

    expect(
      await reset.consumePasswordReset({
        token,
        password: PASSWORDS.current,
      }),
    ).toEqual({ ok: false, reason: 'reused' });

    expect(await reset.getPasswordResetState(token)).toBe('valid');
    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    expect(stored?.passwordHash).toBe(currentHash);
  });

  it('rejects the two most recent previous passwords', async () => {
    await seedPreviousPasswords();
    await reset.requestPasswordReset(user.email);
    const token = issuedToken();

    for (const password of [
      PASSWORDS.previousNewer,
      PASSWORDS.previousOlder,
    ]) {
      expect(await reset.consumePasswordReset({ token, password })).toEqual({
        ok: false,
        reason: 'reused',
      });
    }

    expect(await reset.getPasswordResetState(token)).toBe('valid');
  });

  it('allows a password older than the stored history', async () => {
    await seedPreviousPasswords();
    await reset.requestPasswordReset(user.email);
    const token = issuedToken();

    const consumed = await reset.consumePasswordReset({
      token,
      password: PASSWORDS.fresh,
    });
    expect(consumed.ok).toBe(true);
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
      (
        await reset.consumePasswordReset({
          token,
          password: PASSWORDS.other,
        })
      ).ok,
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
