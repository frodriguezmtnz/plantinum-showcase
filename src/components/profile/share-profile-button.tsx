'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function copyWithFallback(url: string): boolean {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function ShareProfileButton({ username }: { username: string }) {
  const { toast } = useToast();

  async function share() {
    const url = `${window.location.origin}/u/${username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${username} on Platinum Showcase`,
          url,
        });
        return;
      } catch (error) {
        // The user cancelled the native sheet; do not fall back to a toast.
        if ((error as { name?: string }).name === 'AbortError') return;
      }
    }

    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      copied = copyWithFallback(url);
    }

    if (copied) {
      toast({
        title: 'Link copied',
        description: url,
        variant: 'success',
      });
    } else {
      toast({
        title: 'Could not copy the link',
        description: 'Copy it manually from your browser.',
        variant: 'danger',
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={share}
      aria-label={`Share ${username}'s profile`}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
