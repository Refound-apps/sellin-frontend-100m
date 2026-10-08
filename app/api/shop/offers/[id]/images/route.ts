import { NextRequest, NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const backendRes = await backendFetch(`/api/shop/offers/${id}/images`);

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (e) {
      console.warn(`Backend image fetch failed for offer ${id}:`, e);
    }

    try {
      const offerRes = await backendFetch(`/api/offers/${id}`);
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        const offer = offerData.data;

        if (offer) {
          const stored: string[] = [];
          const pushImg = (url?: string | null) => {
            if (!url || typeof url !== 'string' || !url.trim()) return;
            const trimmed = url.trim();
            const full = trimmed.startsWith('/')
              ? `https://pub-d4238224a90a49f98bf05b686985171f.r2.dev${trimmed}`
              : trimmed;
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
