import { prisma } from '@/lib/prisma';
import { toCsv } from '@/lib/csv';
import { isDisposableEmail } from '@/lib/email/domains';

export interface DisposableAuditRow {
  userId: string;
  username: string | null;
  email: string;
  domain: string;
  emailVerified: boolean;
  role: string;
  createdAt: Date;
}

const HEADERS = [
  'userId',
  'username',
  'email',
  'domain',
  'emailVerified',
  'role',
  'createdAt',
] as const;

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

/** Current accounts whose address matches the disposable-domain snapshot. */
export async function findDisposableEmailAccounts(): Promise<
  DisposableAuditRow[]
> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const rows: DisposableAuditRow[] = [];
  for (const user of users) {
    if (!(await isDisposableEmail(user.email))) continue;
    rows.push({
      userId: user.id,
      username: user.username,
      email: user.email,
      domain: domainOf(user.email),
      emailVerified: Boolean(user.emailVerified),
      role: user.role,
      createdAt: user.createdAt,
    });
  }
  return rows;
}

export function disposableAuditCsv(rows: readonly DisposableAuditRow[]): string {
  return toCsv(
    HEADERS,
    rows.map((row) => [
      row.userId,
      row.username,
      row.email,
      row.domain,
      row.emailVerified ? 'true' : 'false',
      row.role,
      row.createdAt.toISOString(),
    ]),
  );
}
