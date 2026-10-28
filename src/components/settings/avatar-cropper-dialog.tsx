'use client';

import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const CROP_SIZE = 512;

async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not read the image.'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is not available.');

  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    CROP_SIZE,
    CROP_SIZE,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not crop the image.')),
      'image/jpeg',
      0.9,
    );
  });
}

interface AvatarCropperDialogProps {
  imageSrc: string | null;
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (blob: Blob) => void;
}

/**
 * Intermediate step between picking a file and uploading it: a round mask over
 * the square crop that matches how the avatar renders, with drag + zoom.
 */
export function AvatarCropperDialog({
  imageSrc,
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: AvatarCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!imageSrc || !area) return;
    setError(null);
    setIsCropping(true);
    try {
      const blob = await cropToBlob(imageSrc, area);
      onConfirm(blob);
    } catch {
      setError('Could not crop that image. Try another file.');
    } finally {
      setIsCropping(false);
    }
  }

  const busy = isCropping || isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[28rem]">
        <DialogHeader>
          <DialogTitle>Crop your avatar</DialogTitle>
          <DialogDescription>
            Drag to reposition and zoom to frame the face. The circle is how it
            will appear; we store a square image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar-zoom">Zoom</Label>
            <Slider
              id="avatar-zoom"
              min={1}
              max={3}
              step={0.01}
              value={[zoom]}
              onValueChange={([value]) => setZoom(value ?? 1)}
              disabled={busy}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy || !area}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Screening…' : 'Use this image'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
