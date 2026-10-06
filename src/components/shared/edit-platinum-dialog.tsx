'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Pencil } from 'lucide-react';
import { editPlatinum } from '@/app/actions';
import { platinumMetaSchema, type PlatinumMetaValues } from '@/lib/schemas';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface EditablePlatinum {
  id: string;
  gameName: string;
  platform: 'PS3' | 'PS4' | 'PS5';
  platinumDate: string;
  isSpoiler: boolean;
  comment?: string | null;
}

interface EditPlatinumDialogProps {
  platinum: EditablePlatinum;
  className?: string;
  showLabel?: boolean;
}

function toDefaults(platinum: EditablePlatinum): PlatinumMetaValues {
  return {
    gameName: platinum.gameName,
    platform: platinum.platform,
    platinumDate: new Date(platinum.platinumDate),
    isSpoiler: platinum.isSpoiler,
    comment: platinum.comment ?? '',
  };
}

export function EditPlatinumDialog({
  platinum,
  className,
  showLabel = false,
}: EditPlatinumDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PlatinumMetaValues>({
    resolver: zodResolver(platinumMetaSchema),
    defaultValues: toDefaults(platinum),
  });

  const busy = isPending || form.formState.isSubmitting;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Re-sync with the (possibly stale) prop each time the dialog opens.
      form.reset(toDefaults(platinum));
    }
  }

  function onSubmit(values: PlatinumMetaValues) {
    startTransition(async () => {
      const result = await editPlatinum(platinum.id, {
        gameName: values.gameName,
        platform: values.platform,
        platinumDate: values.platinumDate.toISOString(),
        isSpoiler: values.isSpoiler,
        comment: values.comment,
      });

      if (!result.success) {
        toast({
          title: 'Edit failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      setOpen(false);
      toast({
        title: 'Platinum updated',
        description: 'Your changes are live.',
      });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={showLabel ? 'default' : 'sm'}
          className={cn(
            'text-muted-foreground hover:text-foreground',
            !showLabel && 'max-sm:size-11',
            className,
          )}
          disabled={busy}
          aria-label="Edit platinum"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
          {showLabel && <span>{busy ? 'Saving...' : 'Edit platinum'}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit platinum</DialogTitle>
          <DialogDescription>
            Update the game details. The screenshot stays exactly the same.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Elden Ring" {...field} disabled={busy} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={busy}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a PlayStation console" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PS5">PlayStation 5</SelectItem>
                      <SelectItem value="PS4">PlayStation 4</SelectItem>
                      <SelectItem value="PS3">PlayStation 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platinumDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Platinum Date</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={busy}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date('2006-11-11')
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about your journey to this platinum..."
                      className="resize-none"
                      disabled={busy}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Share any thoughts, feelings, or tips about this achievement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isSpoiler"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Spoiler Warning</FormLabel>
                    <FormDescription>
                      Mark this if your screenshot contains story spoilers.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={busy}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
