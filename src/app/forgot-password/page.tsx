import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/shared/auth-shell';
import { AuthUtilityAside } from '@/components/shared/auth-utility-aside';
import { KeyResetIllustration } from '@/components/shared/auth-illustrations';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset your password | Platinum Showcase',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email on your account and we will send you a link to choose a new password."
      aside={
        <AuthUtilityAside
          illustration={<KeyResetIllustration />}
          title="Locked out? Sorted."
          description="A single-use link will land in your inbox."
          points={[
            'The link expires after 60 minutes.',
            'Your current password keeps working until you set the new one.',
            'We answer the same whether or not the address exists.',
          ]}
        />
      }
      footer={
        <>
          Remembered it?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
