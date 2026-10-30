import Link from 'next/link';
import { Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfileCompletionProps {
  hasAvatar: boolean;
  hasBio: boolean;
  hasLinks: boolean;
  /** Inside Settings the shortcut would point at the page you are already on. */
  showCta?: boolean;
  className?: string;
}

/** Owner-only nudge that lists what is still missing from the public profile. */
export function ProfileCompletion({
  hasAvatar,
  hasBio,
  hasLinks,
  showCta = false,
  className,
}: ProfileCompletionProps) {
  const steps = [
    { label: 'Avatar', done: hasAvatar },
    { label: 'Bio', done: hasBio },
    { label: 'PSN profile', done: hasLinks },
  ];
  const missing = steps.filter((step) => !step.done).length;
  if (missing === 0) return null;

  return (
    <div
      className={cn(
        'panel-solid rounded-2xl border border-dashed border-border p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="field-mark">Complete your profile</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {steps.length - missing} of {steps.length} done — the rest takes a
            minute.
          </p>
        </div>
        {showCta && (
          <Button asChild size="sm">
            <Link href="/settings#profile">Finish in Settings</Link>
          </Button>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.label} className="inline-flex items-center gap-1.5">
            {step.done ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Circle
                className="h-4 w-4 text-muted-foreground/60"
                aria-hidden
              />
            )}
            <span className={step.done ? '' : 'font-semibold'}>
              {step.label}
            </span>
            <span className="sr-only">{step.done ? '(done)' : '(pending)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
