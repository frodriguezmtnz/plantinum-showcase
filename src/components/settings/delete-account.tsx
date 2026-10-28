'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteAccount } from '@/app/settings/actions';
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
}

export function DeleteAccount({ username }: DeleteAccountProps) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    confirmUsername === username && password.length > 0 && !isPending;

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
        description: 'Your plates and account are gone. Take care, hunter.',
        variant: 'success',
      });
      logout();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label htmlFor="delete-password">Your password</Label>
            <PasswordInput
              id="delete-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
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
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
