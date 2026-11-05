import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('email verification — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let send: typeof import('@/lib/email/send');
  let verification: typeof import('@/lib/email/verification');

  const stamp = Date.now();
  const user = {
    id: `it-verify-${stamp}`,
    email: `it-verify-${stamp}@test.local`,
    username: `it_verify_${stamp}`,
  };

  function issuedToken(): string {
    const entry = send
      .getOutbox()
      .filter((row) => row.kind === 'email-verify')
      .at(-1);
    const match = entry?.text.match(/https?:\/\/\S+verify-email\S*/);
    if (!match) throw new Error('verification link missing from the outbox');
    const token = new URL(match[0]).searchParams.get('token');
    if (!token) throw new Error('token missing from the verification link');
    return token;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.EMAIL_TRANSPORT = 'memory';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9002';

    prisma = (await import('@/lib/prisma')).prisma;
    send = await import('@/lib/email/send');
    verification = await import('@/lib/email/verification');

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: 'hash',
      },
    });
  });

  beforeEach(async () => {
    send.clearOutbox();
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: null },
    });
  });

  afterAll(async () => {
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('sends a link and consumes it once', async () => {
    const requested = await verification.requestEmailVerification(user.id);
    expect(requested.sent).toBe(true);
    expect(send.getOutbox()).toHaveLength(1);
    expect(send.getOutbox()[0]!.to).toBe(user.email);

    const token = issuedToken();
    expect(await verification.getEmailVerificationState(token)).toBe('valid');

    const consumed = await verification.consumeEmailVerification({ token });
    expect(consumed).toEqual({
      ok: true,
      userId: user.id,
      alreadyVerified: false,
    });

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    });
    expect(stored?.emailVerified).toBeInstanceOf(Date);

    // The account is confirmed: the page now reports `verified` and a replay
    // is a no-op that must not celebrate again.
    expect(await verification.getEmailVerificationState(token)).toBe(
      'verified',
    );
    expect(await verification.consumeEmailVerification({ token })).toEqual({
      ok: true,
      userId: user.id,
      alreadyVerified: true,
    });
  });

  it('reports a used link while the account is still unverified', async () => {
    await verification.requestEmailVerification(user.id);
    const token = issuedToken();

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'EMAIL_VERIFY' },
      data: { usedAt: new Date() },
    });

    expect(await verification.getEmailVerificationState(token)).toBe('used');
    expect((await verification.consumeEmailVerification({ token })).ok).toBe(
      false,
    );
  });

  it('rejects expired links', async () => {
    await verification.requestEmailVerification(user.id);
    const token = issuedToken();

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'EMAIL_VERIFY' },
      data: { expiresAt: new Date(0) },
    });

    expect(await verification.getEmailVerificationState(token)).toBe('expired');
    expect((await verification.consumeEmailVerification({ token })).ok).toBe(
      false,
    );
  });

  it('does not send again when the address is already verified', async () => {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    const requested = await verification.requestEmailVerification(user.id);
    expect(requested).toEqual({ sent: false, reason: 'verified' });
    expect(send.getOutbox()).toHaveLength(0);
  });

  it('reports an unknown account without throwing', async () => {
    const requested = await verification.requestEmailVerification(
      `missing-${stamp}`,
    );
    expect(requested).toEqual({ sent: false, reason: 'missing' });
  });
});
