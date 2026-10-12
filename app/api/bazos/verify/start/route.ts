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
    if (!body?.phone) {
      return NextResponse.json({ success: false, error: 'Chybí telefonní číslo' }, { status: 400 });
    }

    const res = await backendFetch('/api/bazos/verify/start', {
      method: 'POST',
      body: JSON.stringify({
        phone: body.phone,
        credentialId: body.credentialId,
        email: body.email || user.email,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Error in /api/bazos/verify/start:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při zahájení ověření na Bazoši' },
      { status: 500 }
    );
  }
}
