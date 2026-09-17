import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const backendRes = await fetch(`${BACKEND_URL}/api/transactions?${searchParams.toString()}`, {
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Chyba při komunikaci s backend serverem.' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error proxying transactions API:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}
