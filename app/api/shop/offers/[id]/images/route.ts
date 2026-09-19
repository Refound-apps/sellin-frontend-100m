import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Fetch images from backend (which gets them from internal Postgres / MinIO)
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/shop/offers/${id}/images`, {
        cache: 'no-store',
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn(`Backend image fetch failed for offer ${id}:`, e);
    }

    // 2. Direct fallback from offer data in DB if image endpoint was temporarily unreachable
    try {
      const offerRes = await fetch(`${BACKEND_URL}/api/offers/${id}`, { cache: 'no-store' });
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        const offer = offerData.data;

        if (offer) {
          const stored: string[] = [];
          const pushImg = (url?: string | null) => {
            if (!url || typeof url !== 'string' || !url.trim()) return;
            const trimmed = url.trim();
            const full = trimmed.startsWith('/') ? `http://46.36.36.196:9000${trimmed}` : trimmed;
            if (!stored.includes(full)) stored.push(full);
          };

          pushImg(offer.preview_image);
          for (let i = 2; i <= 9; i++) {
            pushImg(offer[`image${i}`]);
          }

          return NextResponse.json({
            success: true,
            data: stored,
          });
        }
      }
    } catch (fallbackErr) {
      console.error(`Stored image fallback failed for offer ${id}:`, fallbackErr);
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (err: unknown) {
    console.error('Error proxying images for offer:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst obrázky nabídky.', data: [] },
      { status: 500 }
    );
  }
}
