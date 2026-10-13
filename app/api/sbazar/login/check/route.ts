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

    const res = await backendFetch('/api/sbazar/login/check', {
      method: 'POST',
      body: JSON.stringify({
        credentialId: body.credentialId,
        email: body.email || user.email,
        sbazar_cookie_ds: body.sbazar_cookie_ds,
      }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Error in /api/sbazar/login/check:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při kontrole Sbazar session' },
      { status: 500 }
    );
  }
}
