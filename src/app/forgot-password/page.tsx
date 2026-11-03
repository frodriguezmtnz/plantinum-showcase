import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthShell } from '@/components/shared/auth-shell';
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
