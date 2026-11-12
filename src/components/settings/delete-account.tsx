'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2, MailCheck, Trash2 } from 'lucide-react';
import {
  deleteAccount,
  requestAccountDelete,
} from '@/app/settings/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/shared/password-input';
import { Label } from '@/components/ui/label';

interface DeleteAccountProps {
  username: string;
  /** Google-only accounts have no password, so they confirm by email instead. */
  hasPassword: boolean;
}

export function DeleteAccount({ username, hasPassword }: DeleteAccountProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit = hasPassword
    ? confirmUsername === username && password.length > 0 && !isPending
    : confirmUsername === username && !isPending;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setConfirmUsername('');
      setPassword('');
      setSentTo(null);
    }
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set('confirmUsername', confirmUsername);
    formData.set('password', password);

    startTransition(async () => {
      const result = await deleteAccount(formData);
      if (!result.success) {
        toast({
          title: 'Account not deleted',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      toast({
        title: 'Account deleted',
        description: 'Your plates and account are gone. Take care, trophy hunter.',
        variant: 'success',
      });
      logout();
    });
  }

  function handleRequestLink() {
    const formData = new FormData();
    formData.set('confirmUsername', confirmUsername);

    startTransition(async () => {
      const result = await requestAccountDelete(formData);
      if (!result.success) {
        toast({
          title: 'Confirmation not sent',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      setSentTo(result.email);
      toast({
        title: 'Check your email',
        description: `We sent a confirmation link to ${result.email}. It expires in 30 minutes.`,
        variant: 'success',
      });
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-fit">
          <Trash2 className="h-4 w-4" />
          Delete account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[28rem]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
            Delete your account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Your profile, platinums and uploaded images
            are removed, and frozen Hall of Fame rows stop linking to them.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-semibold">{username}</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={confirmUsername}
              onChange={(event) => setConfirmUsername(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {hasPassword ? (
            <div className="space-y-2">
              <Label htmlFor="delete-password">Your password</Label>
              <PasswordInput
                id="delete-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your account signs in with Google and has no password. We will
                email a single-use confirmation link to your verified address;
                nothing is deleted until you open it.
              </p>
              {sentTo && (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm text-emerald-700"
                >
                  Confirmation sent to <strong>{sentTo}</strong>. Open the link
                  to finish. It expires in 30 minutes.
                </p>
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {hasPassword ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!canSubmit}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete forever
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={handleRequestLink}
              disabled={!canSubmit}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="h-4 w-4" />
              )}
              {sentTo ? 'Resend link' : 'Email confirmation link'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
