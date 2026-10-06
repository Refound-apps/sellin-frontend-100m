import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

/** Proxy: any seller can queue create on a single marketplace for their offer. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const backendRes = await fetch(`${BACKEND_URL}/api/offers/${id}/publish-marketplace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('Error proxying offer publish-marketplace:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}
