import { ImageResponse } from 'next/og';
import { PRODEJOMAT_NAME, PRODEJOMAT_TAGLINE } from '@/lib/prodejomat/seo';

export const alt = `${PRODEJOMAT_NAME} – ${PRODEJOMAT_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 55%, #14532d 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-0.03em' }}>{PRODEJOMAT_NAME}</div>
        <div style={{ marginTop: 18, fontSize: 36, fontWeight: 600, color: '#86efac' }}>
          {PRODEJOMAT_TAGLINE}
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#cbd5e1' }}>
          Bazos · Sbazar · vlastni e-shop · centralni sklad
        </div>
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 280,
            height: 54,
            borderRadius: 14,
            background: '#22c55e',
            color: '#052e16',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          prodejomat.cz
        </div>
      </div>
    ),
    { ...size }
  );
}
