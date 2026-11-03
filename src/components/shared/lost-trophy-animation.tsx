/**
 * The 404 page's lost trophy: a floating cup inside a dashed search ring, with
 * a couple of drifting specks and a sparkle. Same server-rendered SVG + CSS
 * approach as the moved-handle illustration, so it ships no JS and falls back
 * to a fully visible static drawing under prefers-reduced-motion.
 */
export function LostTrophyAnimation({ className }: { className?: string }) {
  return (
    <div
      className={`mx-auto mb-4 text-muted-foreground ${
        className ?? 'h-48 w-48'
      }`}
    >
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
            d="M58 40h44v14c0 13-9.8 23-22 23S58 67 58 54V40Z"
            fill="currentColor"
            fillOpacity="0.14"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <path
            d="M56 40h48"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M58 44c-9.5 0-16 7-16 16s6.5 15 16 13"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M102 44c9.5 0 16 7 16 16s-6.5 15-16 13"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M76 77h8v11h-8z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <rect
            x="66"
            y="88"
            width="28"
            height="7"
            rx="3.5"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <rect
            x="58"
            y="97"
            width="44"
            height="7"
            rx="3.5"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <path
            d="M67 49c1.6-4 4.2-6.6 7.4-7.6"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        <g className="ambient-breathe text-primary">
          <path
            d="M119 33l2.8 6.2 6.2 2.8-6.2 2.8-2.8 6.2-2.8-6.2-6.2-2.8 6.2-2.8Z"
            fill="currentColor"
            fillOpacity="0.6"
          />
        </g>

        <circle
          className="ambient-drift text-primary"
          cx="128"
          cy="108"
          r="2.4"
          fill="currentColor"
          fillOpacity="0.5"
        />
        <circle
          className="ambient-drift ambient-drift--late"
          cx="34"
          cy="52"
          r="1.8"
          fill="currentColor"
          fillOpacity="0.35"
        />
        <circle
          className="ambient-drift ambient-drift--later"
          cx="120"
          cy="124"
          r="1.5"
          fill="currentColor"
          fillOpacity="0.3"
        />
      </svg>
    </div>
  );
}
