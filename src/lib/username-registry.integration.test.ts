import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Postgres suite for the handle reservation table. Gated like the other
 * integration suites (CI sets TEST_DATABASE_URL).
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('username-registry — Postgres integration', () => {
  let registry: typeof import('@/lib/username-registry');
  let prisma: (typeof import('@/lib/prisma'))['prisma'];

  const stamp = Date.now();
  const live = `it_reg_live_${stamp}`;
  const other = `it_reg_other_${stamp}`;
  const reservedOnly = `it_reg_reserved_${stamp}`;
  const userId = `it-reg-user-${stamp}`;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    registry = await import('@/lib/username-registry');
    prisma = (await import('@/lib/prisma')).prisma;

    await prisma.user.create({
      data: {
        id: userId,
        email: `it-reg-${stamp}@test.local`,
        username: live,
      },
    });
    await prisma.usernameHistory.create({
      data: {
        username: reservedOnly,
        usernameLower: reservedOnly.toLowerCase(),
        userId,
      },
    });
  });

  afterAll(async () => {
    await prisma.usernameHistory.deleteMany({
      where: { usernameLower: { in: [live, other, reservedOnly].map((u) => u.toLowerCase()) } },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('treats live accounts and reserved handles as taken', async () => {
    expect(await registry.usernameIsTaken(live)).toBe(true);
    expect(await registry.usernameIsTaken(reservedOnly)).toBe(true);
    expect(await registry.usernameIsTaken(other)).toBe(false);
  });

  it('ignores the current user when checking a rename', async () => {
    expect(await registry.usernameIsTaken(live, userId)).toBe(false);
  });

  it('reserves a released handle idempotently', async () => {
    await registry.reserveUsername(`Released_${stamp}`, userId);
    await registry.reserveUsername(`Released_${stamp}`, userId);

    expect(await registry.usernameIsTaken(`released_${stamp}`)).toBe(true);
  });
});
