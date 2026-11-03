import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/shared/auth-shell';
import { Button } from '@/components/ui/button';
import { getPasswordResetState } from '@/lib/email/password-reset';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Choose a new password | Platinum Showcase',
  robots: { index: false, follow: false },
};

const INVALID_COPY = {
  expired: 'This reset link has expired. Request a new one below.',
  used: 'This reset link has already been used. Request a new one below.',
  invalid: 'This reset link is not valid. Request a new one below.',
} as const;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await getPasswordResetState(token);

  if (state !== 'valid' || !token) {
    return (
      <AuthShell
        title="Reset your password"
        description="We could not use that link."
        footer={
          <>
            Need help?{' '}
            <Link href="/login" className="underline">
              Back to sign in
            </Link>
          </>
        }
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {INVALID_COPY[state === 'valid' ? 'invalid' : state]}
          </p>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Pick a strong password you have not used here before."
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
