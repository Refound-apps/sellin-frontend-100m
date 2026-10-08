import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const { isAdmin } = await resolveCallerOfferScope(supabase, user);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Přístup odepřen: vyžaduje roli administrátora' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const backendRes = await backendFetch(`/api/transactions?${searchParams.toString()}`);

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
