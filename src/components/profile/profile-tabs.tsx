import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ProfileTab = 'gallery' | 'stats' | 'about';

const TABS: { value: ProfileTab; label: string }[] = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'stats', label: 'Stats' },
  { value: 'about', label: 'About' },
];

/** Gallery is the default and lives on the bare profile URL. */
export function ProfileTabs({
  username,
  tab,
}: {
  username: string;
  tab: ProfileTab;
}) {
  return (
    <div className="mb-10 flex justify-center">
      <div className="inline-flex rounded-full border border-border/70 bg-background/40 p-0.5 text-xs">
        {TABS.map((item) => {
          const active = tab === item.value;
          const href =
            item.value === 'gallery'
              ? `/u/${username}`
              : `/u/${username}?tab=${item.value}`;

          return (
            <Link
              key={item.value}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-full px-4 py-1.5 font-semibold transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
