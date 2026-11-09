import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/shared/auth-shell';
import { AuthUtilityAside } from '@/components/shared/auth-utility-aside';
import { EmailVerifyIllustration } from '@/components/shared/auth-illustrations';
import { Button } from '@/components/ui/button';
import { getEmailChangeState } from '@/lib/email/change-email';
import { ConfirmEmailChangeForm } from './confirm-email-change-form';

export const metadata: Metadata = {
  title: 'Confirm your new email | Platinum Showcase',
  robots: { index: false, follow: false },
};

const INVALID_COPY = {
  expired: 'This confirmation link has expired.',
  used: 'This confirmation link has already been used.',
  invalid: 'This confirmation link is not valid.',
} as const;

const VALID_ASIDE = (
  <AuthUtilityAside
    illustration={<EmailVerifyIllustration />}
    title="One click, new address."
    description="Confirm the new email and it becomes your sign-in address."
    points={[
      'Single-use token, valid for 30 minutes.',
      'Your current address still works until you confirm.',
      'Confirming closes every open session.',
    ]}
  />
);

const INVALID_ASIDE = (
  <AuthUtilityAside
    illustration={<EmailVerifyIllustration />}
    title="Links don't last forever."
    description="Change links are single-use and expire after 30 minutes."
    points={[
      'Open Settings to send a new confirmation.',
      'Use the newest email if you requested several.',
      'Your current address stays active until a link is confirmed.',
    ]}
  />
);

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await getEmailChangeState(token);

  if (state !== 'valid' || !token) {
    return (
      <AuthShell
        title="Confirm your new email"
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

  return (
    <AuthShell
      title="Confirm your new email"
      description="One click and this address becomes your sign-in email."
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
      <ConfirmEmailChangeForm token={token} />
    </AuthShell>
  );
}
