'use client';

import { Check, Loader2, X } from 'lucide-react';
import type { UsernameStatus } from '@/hooks/use-username-availability';
import { cn } from '@/lib/utils';

interface UsernameHintProps {
  status: UsernameStatus;
  username: string;
}

/** Live availability copy shared by registration and OAuth onboarding. */
export function UsernameHint({ status, username }: UsernameHintProps) {
  const base = 'flex items-center gap-1.5 text-xs';

  switch (status.state) {
    case 'checking':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking availability…
        </p>
      );
    case 'available':
      return (
        <p className={cn(base, 'text-emerald-500')}>
          <Check className="h-3.5 w-3.5" />
          {username} is available
        </p>
      );
    case 'taken':
      return (
        <p className={cn(base, 'text-destructive')}>
          <X className="h-3.5 w-3.5" />
          That username is already taken.
        </p>
      );
    case 'reserved':
      return (
        <p className={cn(base, 'text-destructive')}>
          <X className="h-3.5 w-3.5" />
          That username is reserved.
        </p>
      );
    case 'rate-limited':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <X className="h-3.5 w-3.5" />
          Too many checks — wait a moment and try again.
        </p>
      );
    case 'invalid':
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          <X className="h-3.5 w-3.5" />
          Use 3–20 characters: letters, numbers, dashes or underscores.
        </p>
      );
    default:
      return (
        <p className={cn(base, 'text-muted-foreground')}>
          3–20 characters — letters, numbers, dashes and underscores.
        </p>
      );
  }
}
