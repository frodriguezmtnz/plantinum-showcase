import { ImageResponse } from 'next/og';

export const alt = 'Platinum Showcase — the community gallery for PlayStation platinums';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Default social card for every page that doesn't ship its own image (home,
// Explore, about, FAQ, pricing…). Phones in the game keep their own og:image
// from `platinum/[id]`'s generateMetadata, which overrides this one.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #ffffff 0%, #eef3fa 55%, #e2ebf7 100%)',
          color: '#1a2433',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 46, height: 46, background: '#e0008e', borderRadius: 12 }} />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.02em' }}>
            Platinum Showcase
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              maxWidth: 1000,
            }}
          >
            Show your platinum to the world.
          </div>
          <div style={{ marginTop: 22, fontSize: 34, fontWeight: 600, color: '#5b6b82' }}>
            The community gallery for PlayStation platinums.
          </div>
        </div>

        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.18em', color: '#8b98ab' }}>
          POST · VOTE · CROWN
        </div>
      </div>
    ),
    { ...size },
  );
}
