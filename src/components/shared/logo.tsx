import Link from 'next/link';
import { PlatinumMarkIcon } from '@/components/icons/platinum-mark-icon';
import { cn } from '@/lib/utils';

const sizes = {
  default: {
    icon: 'w-12 h-12',
    text: 'text-lg md:text-xl',
  },
  sm: {
    icon: 'w-9 h-9 sm:w-12 sm:h-12',
    text: 'text-base sm:text-lg md:text-xl',
  },
};

export function Logo({ size = 'default' }: { size?: keyof typeof sizes }) {
  const { icon, text } = sizes[size];

  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 group">
      <PlatinumMarkIcon
        className={cn(icon, 'shrink-0 transition-transform group-hover:scale-110')}
      />
      <span
        className={cn(
          text,
          'overflow-hidden text-ellipsis font-bold tracking-tight text-foreground font-headline whitespace-nowrap',
        )}
      >
        Platinum Showcase
      </span>
    </Link>
  );
}
