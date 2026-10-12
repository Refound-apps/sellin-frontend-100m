import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

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

    const body = await request.json().catch(() => ({}));
    if (!body?.sessionId || !body?.code) {
      return NextResponse.json({ success: false, error: 'Chybí sessionId nebo ověřovací kód' }, { status: 400 });
    }

    const res = await backendFetch('/api/bazos/verify/confirm', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: body.sessionId,
        code: body.code,
        credentialId: body.credentialId,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Error in /api/bazos/verify/confirm:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při ověřování kódu' },
      { status: 500 }
    );
  }
}
