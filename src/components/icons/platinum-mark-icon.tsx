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
      <g transform="translate(-24 26)">
        <g transform="translate(-28 26)">
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
        </g>
        <g fill="#E0008E">
          <path d="M408 26 A 70 70 0 0 1 458.72 47.75 L 429.96 84.04 L 412.34 71.38 Z" />
          <path d="M462.73 52.36 A 70 70 0 0 1 477.34 105.57 L 431.04 105.71 L 429.96 84.04 Z" />
          <path d="M476.24 111.58 A 70 70 0 0 1 443.75 156.18 L 414.77 120.07 L 431.04 105.71 Z" />
          <path d="M438.37 159.07 A 70 70 0 0 1 383.24 161.47 L 393.41 116.3 L 414.77 120.07 Z" />
          <path d="M377.63 159.07 A 70 70 0 0 1 341.37 117.47 L 383.03 97.25 L 393.41 116.3 Z" />
          <path d="M339.76 111.58 A 70 70 0 0 1 349.68 57.29 L 391.46 77.26 L 383.03 97.25 Z" />
          <path d="M353.27 52.36 A 70 70 0 0 1 401.9 26.27 L 412.34 71.38 L 391.46 77.26 Z" />
        </g>
      </g>
    </svg>
  );
}
