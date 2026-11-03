import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/shared/auth-shell';
import { Button } from '@/components/ui/button';
import { getEmailVerificationState } from '@/lib/email/verification';
import { VerifyEmailForm } from './verify-email-form';

export const metadata: Metadata = {
  title: 'Verify your email | Platinum Showcase',
  robots: { index: false, follow: false },
};

const INVALID_COPY = {
  expired: 'This verification link has expired.',
  used: 'This verification link has already been used.',
  invalid: 'This verification link is not valid.',
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await getEmailVerificationState(token);

  if (state !== 'valid' || !token) {
    return (
      <AuthShell
        title="Verify your email"
        description="We could not use that link."
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
            <Link href="/settings">Resend from Settings</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      description="One click and you can upload, vote and follow."
      footer={
        <>
          Wrong account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </>
      }
    >
      <VerifyEmailForm token={token} />
    </AuthShell>
  );
}
