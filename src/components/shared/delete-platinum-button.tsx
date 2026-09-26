'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deletePlatinum } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface DeletePlatinumButtonProps {
  platinumId: string;
  redirectTo?: string;
  className?: string;
  showLabel?: boolean;
}

export function DeletePlatinumButton({
  platinumId,
  redirectTo,
  className,
  showLabel = false,
}: DeletePlatinumButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlatinum(platinumId);
      if (!result.success) {
        toast({
          title: 'Delete failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      setOpen(false);
      toast({
        title: 'Platinum deleted',
        description: 'Your platinum has been removed.',
      });
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={showLabel ? 'default' : 'sm'}
          className={cn('text-muted-foreground hover:text-destructive', className)}
          disabled={isPending}
          aria-label="Delete platinum"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {showLabel && <span>{isPending ? 'Deleting...' : 'Delete platinum'}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this platinum?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The screenshot and its record will be
            removed permanently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
