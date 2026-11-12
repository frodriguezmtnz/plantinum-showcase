import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('account deletion — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let send: typeof import('@/lib/email/send');
  let accountDelete: typeof import('@/lib/email/account-delete');
  let tokens: typeof import('@/lib/email/tokens');

  const stamp = Date.now();
  const user = {
    id: `it-delete-${stamp}`,
    email: `it-delete-${stamp}@test.local`,
    username: `it_delete_${stamp}`,
  };
  // Password accounts keep the in-app confirmation and must be rejected by the
  // email-link flow.
  const passwordUser = {
    id: `it-delete-pass-${stamp}`,
    email: `it-delete-pass-${stamp}@test.local`,
    username: `it_delete_pass_${stamp}`,
  };

  function issuedToken(): string {
    const entry = send
      .getOutbox()
      .filter((row) => row.kind === 'account-delete-confirm')
      .at(-1);
    const match = entry?.text.match(
      /https?:\/\/\S+confirm-account-delete\S*/,
    );
    if (!match) throw new Error('delete link missing from the outbox');
    const token = new URL(match[0]).searchParams.get('token');
    if (!token) throw new Error('token missing from the delete link');
    return token;
  }

  async function resetUsers() {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        username: user.username,
        passwordHash: null,
        emailVerified: new Date(),
      },
      create: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: null,
        emailVerified: new Date(),
      },
    });
    await prisma.user.upsert({
      where: { id: passwordUser.id },
      update: {
        email: passwordUser.email,
        username: passwordUser.username,
        passwordHash: await bcrypt.hash('Current!Passw0rd123', 10),
      },
      create: {
        id: passwordUser.id,
        email: passwordUser.email,
        username: passwordUser.username,
        passwordHash: await bcrypt.hash('Current!Passw0rd123', 10),
      },
    });
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.EMAIL_TRANSPORT = 'memory';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9002';

    prisma = (await import('@/lib/prisma')).prisma;
    send = await import('@/lib/email/send');
    accountDelete = await import('@/lib/email/account-delete');
    tokens = await import('@/lib/email/tokens');
  });

  beforeEach(async () => {
    send.clearOutbox();
    await prisma.emailToken.deleteMany({
      where: { userId: { in: [user.id, passwordUser.id] } },
    });
    await resetUsers();
  });

  afterAll(async () => {
    await prisma.emailToken.deleteMany({
      where: { userId: { in: [user.id, passwordUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user.id, passwordUser.id] } },
    });
    await prisma.$disconnect();
  });

  it('rejects password accounts and unverified addresses without emailing', async () => {
    expect(
      await accountDelete.requestAccountDelete({ userId: passwordUser.id }),
    ).toEqual({ ok: false, reason: 'has-password' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: null },
    });
    expect(
      await accountDelete.requestAccountDelete({ userId: user.id }),
    ).toEqual({ ok: false, reason: 'unverified' });

    expect(send.getOutbox()).toHaveLength(0);
    expect(
      await prisma.emailToken.count({
        where: { userId: user.id, kind: 'ACCOUNT_DELETE' },
      }),
    ).toBe(0);
  });

  it('emails a single-use link to the verified address', async () => {
    const result = await accountDelete.requestAccountDelete({
      userId: user.id,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.email).toBe(user.email);

    const outbox = send.getOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.kind).toBe('account-delete-confirm');
    expect(outbox[0]!.to).toBe(user.email);

    const token = issuedToken();
    expect(await accountDelete.getAccountDeleteState(token)).toBe('valid');

    const stored = await prisma.emailToken.findUnique({
      where: { tokenHash: tokens.hashEmailToken(token) },
      select: { kind: true, usedAt: true },
    });
    expect(stored).toEqual({ kind: 'ACCOUNT_DELETE', usedAt: null });
  });

  it('replaces the previous link when a new one is requested', async () => {
    await accountDelete.requestAccountDelete({ userId: user.id });
    const first = issuedToken();

    await accountDelete.requestAccountDelete({ userId: user.id });
    const second = issuedToken();

    expect(second).not.toBe(first);
    expect(await accountDelete.getAccountDeleteState(first)).toBe('invalid');
    expect(await accountDelete.getAccountDeleteState(second)).toBe('valid');
  });

  it('refuses a link issued to another account', async () => {
    await accountDelete.requestAccountDelete({ userId: user.id });
    const token = issuedToken();

    expect(
      await accountDelete.consumeAccountDelete({
        token,
        userId: passwordUser.id,
      }),
    ).toEqual({ ok: false, reason: 'forbidden' });

    const stillThere = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    expect(stillThere?.id).toBe(user.id);
    expect(await accountDelete.getAccountDeleteState(token)).toBe('valid');
  });

  it('deletes the account, burns the link and sends the record email', async () => {
    await accountDelete.requestAccountDelete({ userId: user.id });
    const token = issuedToken();
    send.clearOutbox();

    const consumed = await accountDelete.consumeAccountDelete({
      token,
      userId: user.id,
    });
    expect(consumed).toEqual({
      ok: true,
      email: user.email,
      username: user.username,
    });

    expect(
      await prisma.user.findUnique({ where: { id: user.id } }),
    ).toBeNull();
    // The user cascade removes the token row, so a replay is "invalid".
    expect(await accountDelete.getAccountDeleteState(token)).toBe('invalid');
    expect(
      (await accountDelete.consumeAccountDelete({ token, userId: user.id }))
        .ok,
    ).toBe(false);

    const outbox = send.getOutbox();
    expect(outbox.map((row) => row.kind)).toEqual(['account-deleted']);
    expect(outbox[0]!.to).toBe(user.email);
  });

  it('reports expired links without deleting anything', async () => {
    await accountDelete.requestAccountDelete({ userId: user.id });
    const token = issuedToken();

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'ACCOUNT_DELETE' },
      data: { expiresAt: new Date(0) },
    });
    expect(await accountDelete.getAccountDeleteState(token)).toBe('expired');
    expect(
      await accountDelete.consumeAccountDelete({ token, userId: user.id }),
    ).toEqual({ ok: false, reason: 'expired' });

    const stillThere = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    expect(stillThere?.id).toBe(user.id);
  });
});
