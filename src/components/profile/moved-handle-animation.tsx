/**
 * Small server-rendered illustration for released handles: a profile card that
 * drifts, a dashed "ghost" left behind and a drawn X. Pure SVG + CSS (see
 * `moved-*` keyframes in globals.css), so the page still ships zero JS and the
 * reduced-motion override leaves every element visible.
 */
export function MovedHandleAnimation({ className }: { className?: string }) {
  return (
    <div
      className={`moved-illustration mx-auto mb-4 h-48 w-48 text-muted-foreground ${
        className ?? ''
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
          className="moved-halo text-primary"
          cx="80"
          cy="80"
          r="62"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeDasharray="3 9"
        />

        <rect
          className="moved-ghost"
          x="42"
          y="31"
          width="76"
          height="98"
          rx="18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="7 8"
        />

        <g className="moved-card">
          <rect
            x="42"
            y="31"
            width="76"
            height="98"
            rx="18"
            fill="currentColor"
            fillOpacity="0.12"
            stroke="currentColor"
            strokeOpacity="0.42"
            strokeWidth="1.5"
          />
          <circle cx="80" cy="64" r="13" fill="currentColor" fillOpacity="0.4" />
          <path
            d="M60 96c2-8.4 9.8-13 20-13s18 4.6 20 13"
            fill="currentColor"
            fillOpacity="0.28"
          />
          <rect
            x="62"
            y="104"
            width="36"
            height="7"
            rx="3.5"
            fill="currentColor"
            fillOpacity="0.28"
          />
          <g
            className="moved-x text-primary"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
          >
            <path d="M67 51 93 77" />
            <path d="M93 51 67 77" />
          </g>
        </g>

        <circle
          className="moved-dot moved-dot-1 text-primary"
          cx="132"
          cy="48"
          r="2.6"
          fill="currentColor"
          fillOpacity="0.55"
        />
        <circle
          className="moved-dot moved-dot-2 text-primary"
          cx="28"
          cy="106"
          r="2"
          fill="currentColor"
          fillOpacity="0.4"
        />
        <circle
          className="moved-dot moved-dot-3"
          cx="124"
          cy="116"
          r="1.6"
          fill="currentColor"
          fillOpacity="0.3"
        />
      </svg>
    </div>
  );
}
