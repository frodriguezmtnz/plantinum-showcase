import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/shared/auth-shell';
import { AuthUtilityAside } from '@/components/shared/auth-utility-aside';
import { EmailVerifyIllustration } from '@/components/shared/auth-illustrations';
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

const VERIFY_ASIDE = (
  <AuthUtilityAside
    illustration={<EmailVerifyIllustration />}
    title="One link, one use."
    description="Confirm this address and the showcase opens up."
    points={[
      'Single-use token, valid for 24 hours.',
      'We only email you about your account.',
      'Unlocks uploading, voting and following.',
    ]}
  />
);

const VERIFIED_ASIDE = (
  <AuthUtilityAside
    illustration={<EmailVerifyIllustration />}
    title="You're all set."
    description="This address is already confirmed."
    points={[
      'Uploading, voting and following are unlocked.',
      'Old links stay quiet: no second confirmation needed.',
      'Head to Settings if you ever need a fresh link.',
    ]}
  />
);

const EXPIRED_ASIDE = (
  <AuthUtilityAside
    illustration={<EmailVerifyIllustration />}
    title="Links don't last forever."
    description="Verification links are single-use and expire after 24 hours."
    points={[
      'Open Settings to send a fresh link.',
      'Use the newest email if you requested several.',
      'Scanners cannot burn it: it only counts when you press the button.',
    ]}
  />
);

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const state = await getEmailVerificationState(token);

  if (state === 'verified') {
    return (
      <AuthShell
        title="Email already verified"
        description="You confirmed this address earlier, so there is nothing else to do."
        aside={VERIFIED_ASIDE}
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
          <CheckCircle2 className="mx-auto h-12 w-12 text-live" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Uploading, voting and following are already unlocked.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/upload">Upload a platinum</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (state !== 'valid' || !token) {
    return (
      <AuthShell
        title="Verify your email"
        description="We could not use that link."
        aside={EXPIRED_ASIDE}
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
      aside={VERIFY_ASIDE}
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
