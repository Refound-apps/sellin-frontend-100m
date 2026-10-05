import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { getRequestHost, isTenantHost } from '@/lib/prodejomat/host';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

function WheelMark({ box, outer, inner, spoke }: { box: number; outer: number; inner: number; spoke: number }) {
  const mid = box / 2;
  return (
    <div
      style={{
        width: box,
        height: box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: outer,
          border: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: inner,
            border: '2px solid #ffffff',
          }}
        />
      </div>
      {/* Speaks — short bars at N/E/S/W */}
      <div style={{ position: 'absolute', top: 1, left: mid - 1, width: 2, height: spoke, background: '#ffffff' }} />
      <div style={{ position: 'absolute', bottom: 1, left: mid - 1, width: 2, height: spoke, background: '#ffffff' }} />
      <div style={{ position: 'absolute', left: 1, top: mid - 1, width: spoke, height: 2, background: '#ffffff' }} />
      <div style={{ position: 'absolute', right: 1, top: mid - 1, width: spoke, height: 2, background: '#ffffff' }} />
    </div>
  );
}

/** Tenant shops: wheel mark from storefront logo. Prodejomat: bold P. */
export default async function Icon() {
  const headersList = await headers();
  const shopDomainHeader = headersList.get('x-shop-domain');
  const host = await getRequestHost();
  const isTenant = isTenantHost(host, shopDomainHeader);

  if (isTenant) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            borderRadius: 8,
          }}
        >
          <WheelMark box={24} outer={18} inner={8} spoke={3} />
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          borderRadius: 8,
          color: '#ffffff',
          fontSize: 20,
          fontWeight: 900,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
