import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function PlatinumTrophyIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-6 h-6", className)}
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5F5F5" />
          <stop offset="100%" stopColor="#667FB2" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L8 8.5l-6.5 1 4.5 4.5L5 22l7-3.5 7 3.5-1-8 4.5-4.5-6.5-1L12 2z"
        fill="url(#grad1)"
        stroke="#1d273a"
        strokeWidth="1.5"
      />
    </svg>
  );
}
