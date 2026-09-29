import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function PlatinumMarkIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      aria-hidden="true"
      className={cn('w-6 h-6', className)}
      {...props}
    >
      <g transform="translate(-16 18)">
        <g fill="none" strokeLinecap="round">
          <path d="M170 176 C 118 182 116 240 176 248" stroke="#192838" strokeWidth="40" />
          <path d="M342 176 C 394 182 396 240 336 248" stroke="#192838" strokeWidth="40" />
          <path d="M170 176 C 118 182 116 240 176 248" stroke="#8FA6C4" strokeWidth="16" />
          <path d="M342 176 C 394 182 396 240 336 248" stroke="#8FA6C4" strokeWidth="16" />
        </g>
        <path d="M234 296h44l-6 48h-32z" fill="#B8CBDE" stroke="#192838" strokeWidth="16" strokeLinejoin="round" />
        <rect x="206" y="342" width="100" height="28" rx="12" fill="#B8CBDE" stroke="#192838" strokeWidth="16" />
        <rect x="182" y="368" width="148" height="34" rx="14" fill="#9FB6CE" stroke="#192838" strokeWidth="16" />
        <path d="M168 150h176v64q0 86-88 86t-88-86z" fill="#DCE6F2" stroke="#192838" strokeWidth="16" strokeLinejoin="round" />
        <rect x="150" y="112" width="212" height="38" rx="19" fill="#DCE6F2" stroke="#192838" strokeWidth="16" />
        <path d="M406 52c7 36 14 43 50 50-36 7-43 14-50 50-7-36-14-43-50-50 36-7 43-14 50-50z" fill="#E0008E" />
      </g>
    </svg>
  );
}
