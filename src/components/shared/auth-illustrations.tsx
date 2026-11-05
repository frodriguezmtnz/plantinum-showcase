/**
 * Server-rendered drawings for the account utility pages: an envelope with a
 * confirmed check, and a shield with a key. Same ambient SVG + CSS language as
 * the 404/moved-handle illustrations — no JS, and the motion stops under
 * `prefers-reduced-motion`.
 */

import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
}

export function EmailVerifyIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn('mx-auto h-52 w-52 text-muted-foreground', className)}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        role="presentation"
        aria-hidden="true"
        className="h-full w-full"
      >
        <circle
          className="ambient-halo text-primary"
          cx="80"
          cy="80"
          r="62"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeDasharray="3 9"
        />
        <circle
          className="ambient-ghost"
          cx="80"
          cy="80"
          r="44"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 9"
        />

        <g className="ambient-float">
          <rect
            x="34"
            y="52"
            width="92"
            height="62"
            rx="9"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <path
            d="M35 59 L80 88 L125 59"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <g className="text-live">
            <circle
              cx="121"
              cy="51"
              r="15"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M114 51.5 L119 56.5 L128.5 46"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        <circle
          className="ambient-drift"
          cx="38"
          cy="36"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <circle
          className="ambient-drift ambient-drift--late"
          cx="124"
          cy="122"
          r="2.6"
          fill="currentColor"
          fillOpacity="0.45"
        />
        <path
          className="ambient-drift ambient-drift--later"
          d="M46 116 h10"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function KeyResetIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn('mx-auto h-52 w-52 text-muted-foreground', className)}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        role="presentation"
        aria-hidden="true"
        className="h-full w-full"
      >
        <circle
          className="ambient-halo text-primary"
          cx="80"
          cy="80"
          r="62"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeDasharray="3 9"
        />
        <circle
          className="ambient-ghost"
          cx="80"
          cy="80"
          r="44"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="5 9"
        />

        <g className="ambient-float">
          <path
            d="M80 30 C64 37 52 41 42 43 V76 C42 105 58 123 80 132 C102 123 118 105 118 76 V43 C108 41 96 37 80 30 Z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <g className="text-primary">
            <circle
              cx="80"
              cy="70"
              r="10"
              stroke="currentColor"
              strokeWidth="2.2"
            />
            <path
              d="M80 80 V99"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        </g>

        <g
          className="ambient-drift ambient-drift--late"
          transform="rotate(-18 121 110)"
        >
          <circle
            cx="121"
            cy="102"
            r="5.5"
            stroke="currentColor"
            strokeOpacity="0.6"
            strokeWidth="2"
          />
          <path
            d="M121 108 v14 M121 117 h5 M121 122 h4"
            stroke="currentColor"
            strokeOpacity="0.6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        <circle
          className="ambient-drift"
          cx="36"
          cy="40"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          className="ambient-drift ambient-drift--later"
          d="M124 134 h9"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
