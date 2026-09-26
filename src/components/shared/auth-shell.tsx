import Link from 'next/link';
import type { ReactNode } from 'react';
import { Heart, Trophy, Users } from 'lucide-react';
import { PlatinumTrophyIcon } from '@/components/icons/platinum-trophy-icon';

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  error?: string;
}

const HIGHLIGHTS = [
  { icon: Trophy, text: 'Post your platinums with the screenshot and the story behind it.' },
  { icon: Heart, text: 'Vote and discover the community\u2019s favorites.' },
  { icon: Users, text: 'Show off your profile and climb the monthly ranking.' },
];

export function AuthShell({ title, description, children, footer, error }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Link href="/" className="group flex items-center gap-2">
          <PlatinumTrophyIcon className="h-8 w-8 transition-transform group-hover:scale-110" />
          <span className="font-headline text-xl font-bold tracking-tight">Platinum Showcase</span>
        </Link>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline text-4xl font-bold leading-tight">
              Your <span className="text-primary">platinum trophy</span> showcase.
            </h2>
            <p className="text-lg text-muted-foreground">
              Upload your achievements, flex your collection, and compete in the Hall of Fame.
            </p>
          </div>
          <ul className="space-y-4 text-sm">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">Platinum Showcase</p>
      </aside>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="panel w-full max-w-sm rounded-2xl p-8">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <PlatinumTrophyIcon className="h-8 w-8" />
            <span className="font-headline text-xl font-bold tracking-tight">Platinum Showcase</span>
          </Link>

          <div className="space-y-2 text-center lg:text-left">
            <h1 className="font-headline text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6">{children}</div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
