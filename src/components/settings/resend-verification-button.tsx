'use client';

import { useState, useTransition } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { resendVerificationEmail } from '@/app/settings/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function ResendVerificationButton({
  className,
  label = 'Resend verification email',
}: {
  className?: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  function resend() {
    startTransition(async () => {
      const result = await resendVerificationEmail();
      if (!result.success) {
        toast({
          title: 'Could not send the email',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      setSent(true);
      toast({
        title: 'Verification email sent',
        description: result.alreadyVerified
          ? 'Your email is already verified.'
          : 'Check your inbox for the confirmation link.',
        variant: 'success',
      });
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={resend}
      disabled={isPending || sent}
      className={className}
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <MailCheck className="mr-2 h-4 w-4" />
      )}
      {sent ? 'Email sent' : label}
    </Button>
  );
}
