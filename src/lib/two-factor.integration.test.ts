import { generate } from 'otplib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('two-factor — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let twoFactor: typeof import('@/lib/two-factor');

  const stamp = Date.now();
  const user = {
    id: `it-2fa-${stamp}`,
    email: `it-2fa-${stamp}@test.local`,
    username: `it_2fa_${stamp}`,
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    process.env.TOTP_ENCRYPTION_KEY = Buffer.alloc(32, 9).toString('base64');

    prisma = (await import('@/lib/prisma')).prisma;
    twoFactor = await import('@/lib/two-factor');

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: 'hash',
      },
    });
  });

  afterAll(async () => {
    await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  it('accepts a current TOTP code', async () => {
    const secret = twoFactor.generateTwoFactorSecret();
    const encrypted = twoFactor.encryptTwoFactorSecret(secret);
    const token = await generate({ secret });

    expect(await twoFactor.verifyTwoFactorCode(user.id, encrypted, token)).toBe(
      true,
    );
    expect(await twoFactor.verifyTwoFactorCode(user.id, encrypted, '000000')).toBe(
      false,
    );
  });

  it('consumes a recovery code exactly once', async () => {
    await prisma.twoFactorRecoveryCode.deleteMany({ where: { userId: user.id } });
    const code = 'ABCD-EFGH-IJKL-MNOP-QRST';
    await prisma.twoFactorRecoveryCode.create({
      data: {
        userId: user.id,
        codeHash: twoFactor.hashRecoveryCode(code),
      },
    });

    expect(await twoFactor.verifyTwoFactorCode(user.id, null, code)).toBe(true);
    expect(await twoFactor.verifyTwoFactorCode(user.id, null, code)).toBe(false);
  });

  it('rate-limits repeated bad codes', async () => {
    const encrypted = twoFactor.encryptTwoFactorSecret(
      twoFactor.generateTwoFactorSecret(),
    );
    const results: string[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      results.push(
        await twoFactor.verifyTwoFactorLogin(user.id, encrypted, '000000'),
      );
    }

    expect(results.slice(0, 5).every((result) => result === 'invalid')).toBe(
      true,
    );
    expect(results[5]).toBe('rate-limited');
  });
});
