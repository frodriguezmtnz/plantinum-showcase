'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel } from 'lucide-react';
import { appealPlatinum } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AppealPlatinumButtonProps {
  platinumId: string;
  gameName: string;
  className?: string;
}

export function AppealPlatinumButton({
  platinumId,
  gameName,
  className,
}: AppealPlatinumButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await appealPlatinum(platinumId, message);
      if (!result.success) {
        toast({
          title: 'Could not send the appeal',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Appeal sent',
        description: 'A moderator will review it shortly.',
      });
      setOpen(false);
      setMessage('');
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Gavel className="mr-2 h-4 w-4" />
          Appeal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appeal “{gameName}”</DialogTitle>
          <DialogDescription>
            Explain why this platinum should be public again. A moderator reads every appeal.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="For example: this is a genuine in-game screenshot, the blur was just the UI…"
          className="min-h-28 resize-none"
          maxLength={500}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || message.trim().length < 10}>
            {pending ? 'Sending…' : 'Send appeal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
