'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Loader2 } from 'lucide-react';
import { reportPlatinum } from '@/app/actions';
import { reportSchema, type ReportValues } from '@/lib/schemas';
import { ReportReason } from '@/generated/prisma/enums';
import { REPORT_REASON_LABELS } from '@/lib/report-labels';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const REASONS = Object.values(ReportReason);

interface ReportPlatinumButtonProps {
  platinumId: string;
  gameName: string;
  hasOpenReport?: boolean;
  className?: string;
}

export function ReportPlatinumButton({
  platinumId,
  gameName,
  hasOpenReport = false,
  className,
}: ReportPlatinumButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isReported = hasOpenReport || reportSent;

  const form = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { message: '' },
  });

  if (!user) {
    return (
      <Button variant="ghost" asChild className={cn('text-muted-foreground', className)}>
        <Link href={`/login?callbackUrl=/platinum/${platinumId}`}>
          <Flag className="h-4 w-4" />
          Sign in to report
        </Link>
      </Button>
    );
  }

  if (isReported) {
    return (
      <span
        title="You already reported this platinum. A moderator is on it."
        className="inline-flex"
      >
        <Button
          type="button"
          variant="ghost"
          disabled
          className={cn('text-muted-foreground', className)}
        >
          <Flag className="h-4 w-4" />
          Reported
        </Button>
      </span>
    );
  }

  function onSubmit(values: ReportValues) {
    startTransition(async () => {
      const result = await reportPlatinum(platinumId, {
        reason: values.reason,
        message: values.message,
      });

      if (!result.success) {
        toast({
          title: 'Report failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      setReportSent(true);
      setOpen(false);
      form.reset({ message: '' });
      toast({
        title: 'Report sent',
        description: 'Thanks — a moderator will take a look.',
      });
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset({ message: '' });
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn('text-muted-foreground hover:text-destructive', className)}
        >
          <Flag className="h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this platinum</DialogTitle>
          <DialogDescription>
            Flag the screenshot for “{gameName}”. A moderator reviews every report.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-2"
                    >
                      {REASONS.map((reason) => (
                        <label
                          key={reason}
                          htmlFor={`report-${reason}`}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-input p-3 text-sm transition-colors hover:bg-muted/50 has-[:checked]:border-primary/60 has-[:checked]:bg-primary/5"
                        >
                          <RadioGroupItem value={reason} id={`report-${reason}`} />
                          {REPORT_REASON_LABELS[reason]}
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything a moderator should know…"
                      className="resize-none"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send report'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
