'use client';

import { useState, useSyncExternalStore, type SVGProps } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Facebook, Instagram, Link2, Share2 } from 'lucide-react';

type ShareVoice = 'owner' | 'viewer';

interface ShareButtonProps {
  platinumId: string;
  gameName: string;
  /**
   * Who is sharing: the owner gets first-person copy ("I just earned…"),
   * a visitor gets third-person ("Check out…").
   */
  voice?: ShareVoice;
  /** Attributed in the native sheet title on visitor shares. */
  username?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  /** Renders the trigger as the icon alone (with an aria-label). */
  iconOnly?: boolean;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const emptySubscribe = () => () => {};

export function ShareButton({
  platinumId,
  gameName,
  voice = 'viewer',
  username,
  size = 'default',
  variant = 'outline',
  iconOnly = false,
  align = 'start',
  className,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== 'undefined' && !!navigator.share,
    () => false,
  );

  const isOwner = voice === 'owner';
  const getShareUrl = () => `${window.location.origin}/platinum/${platinumId}`;
  const shareText = isOwner
    ? `I just earned the platinum trophy for ${gameName} \u2014 now on my wall at Platinum Showcase.`
    : `Check out this platinum trophy for ${gameName} on Platinum Showcase!`;
  const shareTitle = isOwner ? `Platinum: ${gameName}` : `Platinum: ${gameName} by ${username || 'a user'}`;
  const label = isOwner ? 'Share the win' : 'Share';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: 'Link Copied!',
        description: 'The URL has been copied to your clipboard.',
      });
      return true;
    } catch (error) {
      console.error('Error copying link:', error);
      return false;
    }
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareToX = () => {
    setOpen(false);
    openExternal(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`,
    );
  };

  const shareToFacebook = () => {
    setOpen(false);
    openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`);
  };

  const shareToInstagram = async () => {
    const copied = await copyLink();
    setOpen(false);
    if (copied) {
      openExternal('https://www.instagram.com/');
    }
  };

  const shareNative = async () => {
    setOpen(false);
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: getShareUrl() });
    } catch (error) {
      // Dismissing the share sheet is not a failure — only fall back on real errors.
      if ((error as DOMException | undefined)?.name !== 'AbortError') {
        await copyLink();
      }
    }
  };

  const trigger = (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      aria-label={iconOnly ? 'Share platinum' : undefined}
      onClick={canNativeShare ? shareNative : undefined}
    >
      <Share2 />
      {!iconOnly && label}
    </Button>
  );

  if (canNativeShare) {
    return trigger;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top" align={align} sideOffset={8} className="w-56 p-1.5">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToX}
          >
            <XIcon />
            Share on X
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToFacebook}
          >
            <Facebook />
            Share on Facebook
          </Button>
          <Button
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToInstagram}
          >
            <Instagram />
            Share on Instagram
          </Button>
          <div className="my-1 h-px bg-border" />
          <Button
            variant="ghost"
            className="h-10 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={copyLink}
          >
            <Link2 />
            Copy link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
