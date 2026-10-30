'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { removeAvatar, updateAvatar } from '@/app/settings/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AvatarCropperDialog } from '@/components/settings/avatar-cropper-dialog';

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface AvatarFieldProps {
  username: string;
  initialImage: string | null;
}

export function AvatarField({ username, initialImage }: AvatarFieldProps) {
  const { refresh } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [image, setImage] = useState(initialImage);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function releaseCropSource() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setCropSrc(null);
  }

  function closeCropper() {
    setCropOpen(false);
    releaseCropSource();
  }

  async function syncSession() {
    try {
      await refresh();
    } catch (error) {
      console.warn('[avatar] could not refresh the session', error);
    }
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast({
        title: 'Unsupported format',
        description: 'Use a JPG, PNG or WEBP image.',
        variant: 'danger',
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast({
        title: 'Image too large',
        description: 'The image exceeds the 4 MB size limit.',
        variant: 'danger',
      });
      return;
    }

    releaseCropSource();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCropSrc(url);
    setCropOpen(true);
  }

  function handleConfirm(blob: Blob) {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.set('avatar', file);

    startTransition(async () => {
      const result = await updateAvatar(formData);
      if (!result.success) {
        toast({
          title: 'Avatar not updated',
          description: result.error,
          variant: 'danger',
        });
        return;
      }

      setImage(result.image);
      closeCropper();
      await syncSession();
      router.refresh();

      if (result.warning) {
        toast({
          title: 'Avatar updated',
          description: result.warning,
          variant: 'warning',
        });
        return;
      }

      toast({
        title: 'Avatar updated',
        description: 'Your new picture is live on your profile.',
        variant: 'success',
      });
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeAvatar();
      if (!result.success) {
        toast({
          title: 'Avatar not removed',
          description: result.error,
          variant: 'danger',
        });
        return;
      }
      setImage(result.image);
      await syncSession();
      router.refresh();
      toast({
        title: 'Avatar reset',
        description: 'The generated avatar is back.',
        variant: 'success',
      });
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar className="h-20 w-20 border border-border/60">
        <AvatarImage src={image ?? undefined} alt={`Avatar for ${username}`} />
        <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Upload avatar"
            onChange={handleFile}
            disabled={isPending}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isPending ? 'Screening…' : 'Upload image'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP · up to 4 MB · avatars are screened before they go
          live.
        </p>
      </div>

      <AvatarCropperDialog
        imageSrc={cropSrc}
        open={cropOpen}
        isPending={isPending}
        onOpenChange={(open) => {
          if (!open) closeCropper();
        }}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
