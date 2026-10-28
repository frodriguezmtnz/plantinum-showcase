'use client';

import { useRef, useState, useTransition } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { removeAvatar, updateAvatar } from '@/app/settings/actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AvatarFieldProps {
  username: string;
  initialImage: string | null;
}

export function AvatarField({ username, initialImage }: AvatarFieldProps) {
  const { refresh } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState(initialImage);
  const [isPending, startTransition] = useTransition();

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

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
      void refresh();
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
      void refresh();
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
            Upload image
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
          JPG, PNG or WEBP · square crop, up to 4 MB.
        </p>
      </div>
    </div>
  );
}
