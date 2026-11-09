import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('disposable email audit — Postgres integration', () => {
  let prisma: (typeof import('@/lib/prisma'))['prisma'];
  let audit: typeof import('@/lib/email/disposable-audit');

  const stamp = Date.now();
  const dispo = {
    id: `it-audit-dispo-${stamp}`,
    email: `it-audit-${stamp}@mailinator.com`,
    username: `it_audit_dispo_${stamp}`,
  };
  const normal = {
    id: `it-audit-normal-${stamp}`,
    email: `it-audit-${stamp}@test.local`,
    username: `it_audit_normal_${stamp}`,
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;

    prisma = (await import('@/lib/prisma')).prisma;
    audit = await import('@/lib/email/disposable-audit');

    await prisma.user.createMany({
      data: [
        { id: dispo.id, email: dispo.email, username: dispo.username },
        { id: normal.id, email: normal.email, username: normal.username },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [dispo.id, normal.id] } },
    });
    await prisma.$disconnect();
  });

  it('finds disposable accounts and leaves normal ones out', async () => {
    const rows = await audit.findDisposableEmailAccounts();

    const found = rows.find((row) => row.userId === dispo.id);
    expect(found).toMatchObject({
      email: dispo.email,
      domain: 'mailinator.com',
      emailVerified: false,
    });
    expect(rows.some((row) => row.userId === normal.id)).toBe(false);
  });

  it('renders a CSV with a header and one row per match', async () => {
    const rows = await audit.findDisposableEmailAccounts();
    const csv = audit.disposableAuditCsv(rows);
    const [header, ...lines] = csv.trimEnd().split('\n');

    expect(header).toBe(
      'userId,username,email,domain,emailVerified,role,createdAt',
    );
    expect(lines.some((line) => line.includes(dispo.email))).toBe(true);
    expect(lines.some((line) => line.includes(normal.email))).toBe(false);
  });
});
