'use client';

import { useState, useSyncExternalStore, type SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Facebook, Instagram, Link2, Share2 } from 'lucide-react';

interface ShareWinButtonProps {
  platinumId: string;
  gameName: string;
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const emptySubscribe = () => () => {};

export function ShareWinButton({ platinumId, gameName }: ShareWinButtonProps) {
  const [open, setOpen] = useState(false);
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== 'undefined' && !!navigator.share,
    () => false,
  );

  const getShareUrl = () => `${window.location.origin}/platinum/${platinumId}`;
  const shareText = `I just earned the platinum trophy for ${gameName} on Platinum Showcase!`;

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
      await navigator.share({
        title: `Platinum: ${gameName}`,
        text: shareText,
        url: getShareUrl(),
      });
    } catch (error) {
      // Dismissing the share sheet is not a failure — only fall back on real errors.
      if ((error as DOMException | undefined)?.name !== 'AbortError') {
        await copyLink();
      }
    }
  };

  if (canNativeShare) {
    return (
      <Button type="button" variant="outline" onClick={shareNative}>
        <Share2 />
        Share the win
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <Share2 />
          Share the win
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-56 p-1.5">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToX}
          >
            <XIcon />
            Share on X
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToFacebook}
          >
            <Facebook />
            Share on Facebook
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
            onClick={shareToInstagram}
          >
            <Instagram />
            Share on Instagram
          </Button>
          <div className="my-1 h-px bg-border" />
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-3 rounded-lg px-2 font-medium"
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
