import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

const PASSWORD = 'Current!Passw0rd123';
const NEW_EMAIL = 'new';

describe.skipIf(!url)('email change — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let send: typeof import('@/lib/email/send');
  let change: typeof import('@/lib/email/change-email');
  let tokens: typeof import('@/lib/email/tokens');
  let passwordHash = '';

  const stamp = Date.now();
  const user = {
    id: `it-change-${stamp}`,
    email: `it-change-${stamp}@test.local`,
    username: `it_change_${stamp}`,
  };
  const target = `${NEW_EMAIL}-${stamp}@test.local`;
  const other = {
    id: `it-change-other-${stamp}`,
    email: `it-change-other-${stamp}@test.local`,
    username: `it_change_other_${stamp}`,
  };

  function issuedToken(): string {
    const entry = send
      .getOutbox()
      .filter((row) => row.kind === 'email-change-confirm')
      .at(-1);
    const match = entry?.text.match(/https?:\/\/\S+confirm-email-change\S*/);
    if (!match) throw new Error('change link missing from the outbox');
    const token = new URL(match[0]).searchParams.get('token');
    if (!token) throw new Error('token missing from the change link');
    return token;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.EMAIL_TRANSPORT = 'memory';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:9002';

    prisma = (await import('@/lib/prisma')).prisma;
    send = await import('@/lib/email/send');
    change = await import('@/lib/email/change-email');
    tokens = await import('@/lib/email/tokens');
    passwordHash = await bcrypt.hash(PASSWORD, 10);

    await prisma.user.createMany({
      data: [
        {
          id: user.id,
          email: user.email,
          username: user.username,
          passwordHash,
        },
        {
          id: other.id,
          email: other.email,
          username: other.username,
          passwordHash,
        },
      ],
    });
  });

  beforeEach(async () => {
    send.clearOutbox();
    await prisma.emailToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email,
        emailVerified: null,
        sessionVersion: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.emailToken.deleteMany({
      where: { userId: { in: [user.id, other.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [user.id, other.id] } },
    });
    await prisma.$disconnect();
  });

  it('rejects the wrong current password without issuing a link', async () => {
    const result = await change.requestEmailChange({
      userId: user.id,
      newEmail: target,
      currentPassword: 'wrong',
    });

    expect(result).toEqual({ ok: false, reason: 'password' });
    expect(send.getOutbox()).toHaveLength(0);
    expect(
      await prisma.emailToken.count({
        where: { userId: user.id, kind: 'EMAIL_CHANGE' },
      }),
    ).toBe(0);
  });

  it('rejects the current address, disposable domains and taken addresses', async () => {
    expect(
      await change.requestEmailChange({
        userId: user.id,
        newEmail: user.email,
        currentPassword: PASSWORD,
      }),
    ).toEqual({ ok: false, reason: 'same' });

    expect(
      await change.requestEmailChange({
        userId: user.id,
        newEmail: `someone-${stamp}@mailinator.com`,
        currentPassword: PASSWORD,
      }),
    ).toEqual({ ok: false, reason: 'disposable' });

    expect(
      await change.requestEmailChange({
        userId: user.id,
        newEmail: other.email,
        currentPassword: PASSWORD,
      }),
    ).toEqual({ ok: false, reason: 'in-use' });
    expect(send.getOutbox()).toHaveLength(0);
  });

  it('sends the link to the new address and warns the old one', async () => {
    const result = await change.requestEmailChange({
      userId: user.id,
      newEmail: target,
      currentPassword: PASSWORD,
    });
    expect(result.ok).toBe(true);

    const outbox = send.getOutbox();
    expect(outbox).toHaveLength(2);
    expect(outbox[0]!.kind).toBe('email-change-confirm');
    expect(outbox[0]!.to).toBe(target);
    expect(outbox[1]!.kind).toBe('email-change-requested');
    expect(outbox[1]!.to).toBe(user.email);

    const token = issuedToken();
    expect(await change.getEmailChangeState(token)).toBe('valid');

    const stored = await prisma.emailToken.findUnique({
      where: { tokenHash: tokens.hashEmailToken(token) },
      select: { kind: true, pendingEmail: true, usedAt: true },
    });
    expect(stored).toEqual({
      kind: 'EMAIL_CHANGE',
      pendingEmail: target,
      usedAt: null,
    });
    expect(tokens.hashEmailToken(token)).not.toBe(token);
  });

  it('switches the address, bumps the session version and burns other links', async () => {
    await change.requestEmailChange({
      userId: user.id,
      newEmail: target,
      currentPassword: PASSWORD,
    });
    const token = issuedToken();

    const verify = tokens.issueEmailToken('EMAIL_VERIFY');
    const reset = tokens.issueEmailToken('PASSWORD_RESET');
    await prisma.emailToken.createMany({
      data: [
        {
          userId: user.id,
          kind: 'EMAIL_VERIFY',
          tokenHash: verify.tokenHash,
          expiresAt: verify.expiresAt,
        },
        {
          userId: user.id,
          kind: 'PASSWORD_RESET',
          tokenHash: reset.tokenHash,
          expiresAt: reset.expiresAt,
        },
      ],
    });

    send.clearOutbox();
    const consumed = await change.consumeEmailChange({ token });
    expect(consumed).toMatchObject({ ok: true, email: target });

    const stored = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        emailVerified: true,
        sessionVersion: true,
      },
    });
    expect(stored?.email).toBe(target);
    expect(stored?.emailVerified).toBeInstanceOf(Date);
    expect(stored?.sessionVersion).toBe(1);

    expect(await change.getEmailChangeState(token)).toBe('used');
    expect((await change.consumeEmailChange({ token })).ok).toBe(false);

    const left = await prisma.emailToken.findMany({
      where: { userId: user.id },
      select: { kind: true },
    });
    expect(left).toEqual([{ kind: 'EMAIL_CHANGE' }]);

    const outbox = send.getOutbox();
    expect(outbox.map((row) => row.kind).sort()).toEqual([
      'email-change-active',
      'email-changed',
    ]);
    expect(outbox.find((row) => row.kind === 'email-changed')?.to).toBe(
      user.email,
    );
    expect(outbox.find((row) => row.kind === 'email-change-active')?.to).toBe(
      target,
    );
  });

  it('reports expired and used links', async () => {
    await change.requestEmailChange({
      userId: user.id,
      newEmail: target,
      currentPassword: PASSWORD,
    });
    const token = issuedToken();

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'EMAIL_CHANGE' },
      data: { expiresAt: new Date(0) },
    });
    expect(await change.getEmailChangeState(token)).toBe('expired');
    expect((await change.consumeEmailChange({ token })).ok).toBe(false);

    await prisma.emailToken.updateMany({
      where: { userId: user.id, kind: 'EMAIL_CHANGE' },
      data: { usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) },
    });
    expect(await change.getEmailChangeState(token)).toBe('used');
    expect(await change.consumeEmailChange({ token })).toEqual({
      ok: false,
      reason: 'used',
    });
  });

  it('replaces the previous change link when a new one is requested', async () => {
    await change.requestEmailChange({
      userId: user.id,
      newEmail: target,
      currentPassword: PASSWORD,
    });
    const first = issuedToken();

    const secondTarget = `second-${stamp}@test.local`;
    await change.requestEmailChange({
      userId: user.id,
      newEmail: secondTarget,
      currentPassword: PASSWORD,
    });
    const second = issuedToken();

    expect(second).not.toBe(first);
    expect(await change.getEmailChangeState(first)).toBe('invalid');
    expect(await change.getEmailChangeState(second)).toBe('valid');
  });
});
