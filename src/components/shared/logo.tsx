import Link from 'next/link';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <PlatinumTrophyIcon className="w-8 h-8 transition-transform group-hover:scale-110" />
      <span className="text-lg md:text-xl font-bold tracking-tight text-foreground font-headline whitespace-nowrap">
        Platinum Showcase
      </span>
    </Link>
  );
}
