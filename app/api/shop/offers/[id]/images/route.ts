import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

async function probeBazosImages(link: string): Promise<string[]> {
  const listingId = link.match(/inzerat\/(\d+)/)?.[1];
  if (!listingId) return [];

  const isSk = link.includes('bazos.sk');
  const domain = isSk ? 'www.bazos.sk' : 'www.bazos.cz';
  const folder = listingId.slice(-3);

  const checks = Array.from({ length: 15 }, (_, idx) => {
    const n = idx + 1;
    const url = `https://${domain}/img/${n}/${folder}/${listingId}.jpg`;
    return fetch(url, { method: 'HEAD' })
      .then((r) => (r.ok ? { n, url } : null))
      .catch(() => null);
  });

  const results = await Promise.all(checks);
  const active = results.filter((item): item is { n: number; url: string } => Boolean(item));
  return active.sort((a, b) => a.n - b.n).map((x) => x.url);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. First attempt: Ask backend
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/shop/offers/${id}/images`, {
        cache: 'no-store',
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        // If backend returned a full gallery (more than 1 image), return immediately
        if (data && Array.isArray(data.data) && data.data.length > 1) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn(`Backend image fetch failed for offer ${id}:`, e);
    }

    // 2. Fallback / Enhancement: Check offer details to see if there is a Bazos listing link
    let fallbackGallery: string[] = [];
    try {
      const offerRes = await fetch(`${BACKEND_URL}/api/offers/${id}`, { cache: 'no-store' });
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        const offer = offerData.data;

        if (offer) {
          // Collect stored images first
          const stored: string[] = [];
          const pushImg = (url?: string | null) => {
            if (!url || typeof url !== 'string') return;
            const full = url.startsWith('/') ? `http://46.36.36.196:9000${url}` : url;
            if (!stored.includes(full)) stored.push(full);
          };
          pushImg(offer.preview_image);
          for (let i = 2; i <= 9; i++) {
            pushImg(offer[`image${i}`]);
          }
          fallbackGallery = stored;

          // If offer has bb_id, fetch marketplace details for Bazos link
          if (offer.bb_id) {
            const detailsRes = await fetch(
              `${BACKEND_URL}/api/offers/${encodeURIComponent(offer.bb_id)}/details`,
              { cache: 'no-store' }
            );
            if (detailsRes.ok) {
              const detailsData = await detailsRes.json();
              const details: any[] = detailsData.data || [];
              const bazos = details.find(
                (d) => String(d.bb_marketplace_id || '').toLowerCase().includes('bazo') && d.link
              );
              if (bazos?.link) {
                const bazosImages = await probeBazosImages(bazos.link);
                if (bazosImages.length > 0) {
                  fallbackGallery = bazosImages;
                }
              }
            }
          }
        }
      }
    } catch (fallbackErr) {
      console.error(`Fallback gallery resolution failed for offer ${id}:`, fallbackErr);
    }

    return NextResponse.json({
      success: true,
      data: fallbackGallery,
    });
  } catch (err: unknown) {
    console.error('Error proxying images for offer:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst obrázky nabídky.', data: [] },
      { status: 500 }
    );
  }
}
