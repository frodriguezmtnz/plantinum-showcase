import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AuthShell } from '@/components/shared/auth-shell';
import { AuthUtilityAside } from '@/components/shared/auth-utility-aside';
import { AccountDeleteIllustration } from '@/components/shared/auth-illustrations';
import { Button } from '@/components/ui/button';
import { getAccountDeleteState } from '@/lib/email/account-delete';
import { ConfirmAccountDeleteForm } from './confirm-account-delete-form';

export const metadata: Metadata = {
  title: 'Confirm account deletion | Platinum Showcase',
  robots: { index: false, follow: false },
};

const INVALID_COPY = {
  expired: 'This confirmation link has expired.',
  used: 'This confirmation link has already been used.',
  invalid: 'This confirmation link is not valid.',
} as const;

const VALID_ASIDE = (
  <AuthUtilityAside
    illustration={<AccountDeleteIllustration />}
    title="Last chance to turn back."
    description="Opening this link was the confirmation step; the delete below is the point of no return."
    points={[
      'Your profile, platinums and uploaded images are removed.',
      'Frozen Hall of Fame rows stop linking to your account.',
      'Single-use link, valid for 30 minutes after it is sent.',
    ]}
  />
);

const INVALID_ASIDE = (
  <AuthUtilityAside
    illustration={<AccountDeleteIllustration />}
    title="Links don't last forever."
    description="Deletion links are single-use and expire after 30 minutes."
    points={[
      'Open Settings to request a new confirmation.',
      'Use the newest email if you requested several.',
      'Your account stays untouched until a link is confirmed.',
    ]}
  />
);

export default async function ConfirmAccountDeletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const session = await auth();

  if (!session?.user?.id) {
    const callbackUrl = `/confirm-account-delete?token=${encodeURIComponent(
      token ?? '',
    )}`;
    return (
      <AuthShell
        title="Sign in to confirm"
        description="This link deletes an account, so we need you signed in first."
        aside={VALID_ASIDE}
        footer={
          <>
            Wrong account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in with the account this link was sent to; the link alone is
            not enough.
          </p>
          <Button asChild className="w-full">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Sign in to continue
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  const state = await getAccountDeleteState(token);

  if (state !== 'valid' || !token) {
    return (
      <AuthShell
        title="Confirm account deletion"
        description="We could not use that link."
        aside={INVALID_ASIDE}
        footer={
          <>
            Need a new one?{' '}
            <Link href="/settings" className="underline">
              Open Settings
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {INVALID_COPY[state === 'valid' ? 'invalid' : state]}
          </p>
          <Button asChild className="w-full">
            <Link href="/settings">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      email: true,
      _count: { select: { platinums: true } },
    },
  });
  const username = user?.username ?? null;
  const email = user?.email ?? session.user.email ?? '';
  const platinumCount = user?._count.platinums ?? 0;

  return (
    <AuthShell
      title={username ? `Delete @${username}?` : 'Delete your account?'}
      description={
        username ? (
          <>
            You are signed in as{' '}
            <strong className="text-foreground">@{username}</strong> · {email}.
            This is the account that will be destroyed.
          </>
        ) : (
          'This is the final confirmation. It cannot be undone.'
        )
      }
      aside={VALID_ASIDE}
      footer={
        <>
          Changed your mind?{' '}
          <Link href="/settings" className="underline">
            Back to Settings
          </Link>
        </>
      }
    >
      <ConfirmAccountDeleteForm
        token={token}
        username={username}
        platinumCount={platinumCount}
      />
    </AuthShell>
  );
}
