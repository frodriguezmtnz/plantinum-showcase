import { cn } from '@/lib/utils';
import type { ModerationStatus } from '@/lib/data';

interface ModerationRibbonProps {
  status: ModerationStatus;
  className?: string;
}

/**
 * Red band pinned across the top of a screenshot while a plate is not public.
 * Sits above every other overlay so the status stays legible on spoilered or
 * pixelated images.
 */
export function ModerationRibbon({ status, className }: ModerationRibbonProps) {
  const hidden = status === 'HIDDEN';

  return (
    <div
      role="status"
      className={cn(
        'moderation-ribbon absolute inset-x-0 top-0 z-30 py-1.5 text-center text-[0.7rem] font-bold uppercase tracking-[0.22em]',
        className,
      )}
    >
      <span>{hidden ? 'Hidden' : 'Under review'}</span>
    </div>
  );
}
