import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** POST /api/upload/image — logged-in sellers only. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const body = await request.text();
    const backendRes = await backendFetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('POST /api/upload/image error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se nahrát obrázek.' },
      { status: 500 }
    );
  }
}
