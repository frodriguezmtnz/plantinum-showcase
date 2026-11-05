import bcrypt from 'bcrypt';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('password history — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let history: typeof import('@/lib/password-history');

  const stamp = Date.now();
  const user = {
    id: `it-pwhash-${stamp}`,
    email: `it-pwhash-${stamp}@test.local`,
    username: `it_pwhash_${stamp}`,
  };

  const plain = {
    current: 'Current!Passw0rd123',
    newer: 'Previous!Newer12345',
    older: 'Previous!Older12345',
    fresh: 'Fresh!Passw0rd1234',
  };

  let hashes: Record<keyof typeof plain, string>;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;

    prisma = (await import('@/lib/prisma')).prisma;
    history = await import('@/lib/password-history');

    hashes = {
      current: await bcrypt.hash(plain.current, 4),
      newer: await bcrypt.hash(plain.newer, 4),
      older: await bcrypt.hash(plain.older, 4),
      fresh: await bcrypt.hash(plain.fresh, 4),
    };

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        passwordHash: hashes.current,
      },
    });
  });

  beforeEach(async () => {
    await prisma.passwordHistory.deleteMany({ where: { userId: user.id } });
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashes.current },
    });
  });

  afterAll(async () => {
    await prisma.passwordHistory.deleteMany({ where: { userId: user.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  async function seed() {
    await prisma.passwordHistory.createMany({
      data: [
        {
          userId: user.id,
          passwordHash: hashes.older,
          createdAt: new Date(Date.now() - 60_000),
        },
        {
          userId: user.id,
          passwordHash: hashes.newer,
          createdAt: new Date(Date.now() - 30_000),
        },
      ],
    });
  }

  it('matches the current password and the two most recent ones', async () => {
    await seed();

    for (const password of [plain.current, plain.newer, plain.older]) {
      expect(
        await history.isRecentPassword({
          db: prisma,
          userId: user.id,
          currentHash: hashes.current,
          password,
        }),
      ).toBe(true);
    }

    expect(
      await history.isRecentPassword({
        db: prisma,
        userId: user.id,
        currentHash: hashes.current,
        password: plain.fresh,
      }),
    ).toBe(false);
  });

  it('records the replaced hash and keeps only the two newest', async () => {
    await seed();

    await prisma.$transaction(async (tx) => {
      await history.rememberPassword({
        db: tx,
        userId: user.id,
        passwordHash: hashes.current,
      });
    });

    const rows = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { passwordHash: true },
    });

    expect(rows).toHaveLength(history.PASSWORD_HISTORY_LIMIT);
    expect(rows[0]!.passwordHash).toBe(hashes.current);
    expect(rows[1]!.passwordHash).toBe(hashes.newer);
  });
});
