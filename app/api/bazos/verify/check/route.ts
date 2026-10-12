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

    const res = await backendFetch('/api/bazos/verify/check', {
      method: 'POST',
      body: JSON.stringify({
        credentialId: body.credentialId,
        bkod: body.bkod,
        email: body.email || user.email,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Error in /api/bazos/verify/check:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při kontrole stavu Bazoše' },
      { status: 500 }
    );
  }
}
