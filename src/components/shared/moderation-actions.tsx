'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, EyeOff, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { moderatePlatinum, moderateReport, type PlatinumModerationOp } from '@/app/actions';
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

type ActionResult = { success: true } | { success: false; error: string };

function useModerationAction() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<ActionResult>,
    { successTitle, successDescription }: { successTitle: string; successDescription: string },
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast({ title: 'Action failed', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: successTitle, description: successDescription });
      router.refresh();
    });
  }

  return { isPending, run };
}

interface ReportRowActionsProps {
  reportId: string;
  gameName: string;
}

export function ReportRowActions({ reportId, gameName }: ReportRowActionsProps) {
  const { isPending, run } = useModerationAction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-emerald-500 hover:text-emerald-400"
        onClick={() =>
          run(() => moderateReport(reportId, 'dismiss'), {
            successTitle: 'Report dismissed',
            successDescription: `${gameName} stays online.`,
          })
        }
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Keep
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-muted-foreground hover:text-foreground"
        onClick={() =>
          run(() => moderateReport(reportId, 'hide'), {
            successTitle: 'Plate hidden',
            successDescription: `${gameName} is off the public lists.`,
          })
        }
      >
        <EyeOff className="h-4 w-4" />
        Hide
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this platinum?</AlertDialogTitle>
            <AlertDialogDescription>
              The screenshot and its record for “{gameName}” are removed permanently, along
              with its votes. The frozen history keeps the frozen row.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                run(() => moderateReport(reportId, 'delete'), {
                  successTitle: 'Platinum deleted',
                  successDescription: `${gameName} has been removed.`,
                });
                setConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface HiddenPlateActionsProps {
  platinumId: string;
  gameName: string;
}

export function HiddenPlateActions({ platinumId, gameName }: HiddenPlateActionsProps) {
  const { isPending, run } = useModerationAction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-muted-foreground hover:text-foreground"
        onClick={() =>
          run(() => moderatePlatinum(platinumId, 'PUBLISHED'), {
            successTitle: 'Plate restored',
            successDescription: `${gameName} is public again.`,
          })
        }
      >
        <RotateCcw className="h-4 w-4" />
        Restore
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this platinum?</AlertDialogTitle>
            <AlertDialogDescription>
              “{gameName}” will be removed permanently, along with its votes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                run(() => moderatePlatinum(platinumId, 'DELETE' satisfies PlatinumModerationOp), {
                  successTitle: 'Platinum deleted',
                  successDescription: `${gameName} has been removed.`,
                });
                setConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
