/**
 * Server-rendered drawings for the account utility pages: an envelope with a
 * confirmed check, a shield with a key, a trophy above a handle tag, and a bin
 * swallowing the trophy for the danger flow. Same ambient SVG + CSS language
 * as the 404/moved-handle illustrations — no JS, and the motion stops under
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

export function HandleSetupIllustration({ className }: IllustrationProps) {
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
          <g
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M62 35.6 H98 V48.8 A18 18 0 0 1 62 48.8 Z" />
            <path d="M62 40.4 C53.6 40.4 53.6 52.4 62 52.4" fill="none" />
            <path d="M98 40.4 C106.4 40.4 106.4 52.4 98 52.4" fill="none" />
            <path d="M75.2 64.8 H84.8 L83.6 76.4 H76.4 Z" />
          </g>
          <rect
            className="text-primary"
            x="66.8"
            y="76.4"
            width="26.4"
            height="6"
            rx="2.4"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />

          <rect
            x="40"
            y="98"
            width="80"
            height="26"
            rx="13"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <text
            className="text-primary"
            x="80"
            y="111.3"
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
            fontSize="13"
            fontWeight="700"
          >
            @handle
          </text>
        </g>

        <circle
          className="ambient-drift"
          cx="34"
          cy="42"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <circle
          className="ambient-drift ambient-drift--late"
          cx="126"
          cy="122"
          r="2.4"
          fill="currentColor"
          fillOpacity="0.45"
        />
        <path
          className="ambient-drift ambient-drift--later"
          d="M42 140 h10"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Farewell for the deleted-account screen: the trophy lifts and dissolves. */
export function FarewellTrophyIllustration({ className }: IllustrationProps) {
  return (
    <div className={cn('mx-auto h-52 w-52 text-muted-foreground', className)}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        role="presentation"
        aria-hidden="true"
        className="h-full w-full"
      >
        <g className="farewell-trophy">
          <circle
            className="text-primary"
            cx="80"
            cy="80"
            r="62"
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            strokeDasharray="3 9"
          />
          <circle
            cx="80"
            cy="80"
            r="44"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="5 9"
          />

          <g
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M62 35.6 H98 V48.8 A18 18 0 0 1 62 48.8 Z" />
            <path d="M62 40.4 C53.6 40.4 53.6 52.4 62 52.4" fill="none" />
            <path d="M98 40.4 C106.4 40.4 106.4 52.4 98 52.4" fill="none" />
            <path d="M75.2 64.8 H84.8 L83.6 76.4 H76.4 Z" />
          </g>
          <rect
            className="text-primary"
            x="66.8"
            y="76.4"
            width="26.4"
            height="6"
            rx="2.4"
            fill="currentColor"
            fillOpacity="0.28"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />

          <rect
            x="40"
            y="98"
            width="80"
            height="26"
            rx="13"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <text
            className="text-primary"
            x="80"
            y="111.3"
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"
            fontSize="13"
            fontWeight="700"
          >
            @handle
          </text>
        </g>
      </svg>
    </div>
  );
}

/** Danger-page drawing: a bin with the trophy dropping in, not a celebration. */
export function AccountDeleteIllustration({ className }: IllustrationProps) {
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
          {/* The trophy about to go in. */}
          <g
            transform="translate(80 50) scale(0.46) rotate(12) translate(-80 -59)"
            fill="currentColor"
            fillOpacity="0.14"
            stroke="currentColor"
            strokeOpacity="0.5"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M62 35.6 H98 V48.8 A18 18 0 0 1 62 48.8 Z" />
            <path d="M62 40.4 C53.6 40.4 53.6 52.4 62 52.4" fill="none" />
            <path d="M98 40.4 C106.4 40.4 106.4 52.4 98 52.4" fill="none" />
            <path d="M75.2 64.8 H84.8 L83.6 76.4 H76.4 Z" />
            <rect x="66.8" y="76.4" width="26.4" height="6" rx="2.4" />
          </g>

          {/* Open lid, tilted ajar. */}
          <g
            transform="rotate(-9 80 69)"
            fill="currentColor"
            fillOpacity="0.18"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <rect x="52" y="64" width="56" height="8" rx="4" />
            <path d="M72 64 a8 6 0 0 1 16 0" fill="none" strokeLinecap="round" />
          </g>

          {/* Bin body. */}
          <path
            d="M56 78 h48 l-5 46 a6 6 0 0 1 -6 5 h-26 a6 6 0 0 1 -6 -5 z"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <g stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round">
            <path d="M70 88 v32" />
            <path d="M80 88 v34" />
            <path d="M90 88 v32" />
          </g>
        </g>

        <circle
          className="ambient-drift"
          cx="36"
          cy="44"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <path
          className="ambient-drift ambient-drift--late"
          d="M112 30 h9"
          stroke="currentColor"
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          className="ambient-drift ambient-drift--later"
          cx="126"
          cy="126"
          r="2.4"
          fill="currentColor"
          fillOpacity="0.45"
        />
      </svg>
    </div>
  );
}
