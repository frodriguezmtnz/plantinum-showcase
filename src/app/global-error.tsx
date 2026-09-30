'use client';

// Root-layout failures replace the whole document, so this file carries its own
// inline styles (globals.css is not loaded here) and its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'hsl(0 0% 99%)',
          color: 'hsl(212 38% 16%)',
          fontFamily: 'Mulish, system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'hsl(211 22% 36%)',
              margin: 0,
            }}
          >
            Platinum Showcase
          </p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '1rem 0 0' }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0.75rem 0 0', color: 'hsl(211 22% 36%)', lineHeight: 1.6 }}>
            An unexpected error took the console down. Reload the page, or try again in a moment.
          </p>
          {error.digest ? (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'hsl(211 22% 46%)' }}>
              Ref: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '2rem',
              height: '40px',
              padding: '0 20px',
              borderRadius: '9999px',
              border: 'none',
              background: 'hsl(0 0% 10%)',
              color: 'hsl(0 0% 98%)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
