import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

/** POST /api/offers/create — seller creates offer for own / subaccount email only. */
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

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);
    const body = await request.json();
    const bbEmail = String(body?.bb_email || '')
      .toLowerCase()
      .trim();

    if (!bbEmail) {
      return NextResponse.json(
        { success: false, error: 'Chybí e-mail účtu (bb_email).' },
        { status: 400 }
      );
    }

    if (!isAdmin && !allowedEmails.includes(bbEmail)) {
      return NextResponse.json(
        { success: false, error: 'Nemůžete vytvořit nabídku na cizí účet.' },
        { status: 403 }
      );
    }

    const backendRes = await backendFetch('/api/offers/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('POST /api/offers/create error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se vytvořit nabídku.' },
      { status: 500 }
    );
  }
}
