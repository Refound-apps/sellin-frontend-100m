import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetch(`${BACKEND_URL}/api/shop/offers/${id}/images`, {
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Chyba při komunikaci s backend serverem.', data: [] },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error proxying images for offer:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst obrázky nabídky.', data: [] },
      { status: 500 }
    );
  }
}
