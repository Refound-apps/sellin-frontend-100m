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
      console.warn('[offers/create] forbidden bb_email', {
        bbEmail,
        user: user.email,
        allowedCount: allowedEmails.length,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Nemůžete vytvořit nabídku na cizí účet. Zvolte účet ze seznamu prodejce.',
        },
        { status: 403 }
      );
    }

    const backendRes = await backendFetch('/api/offers/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await backendRes.text().catch(() => '');
      console.error('[offers/create] non-JSON backend response', backendRes.status, text.slice(0, 200));
      return NextResponse.json(
        {
          success: false,
          error:
            backendRes.status === 404
              ? 'Backend endpoint pro vytvoření nabídky není dostupný (špatná API URL).'
              : 'Backend vrátil neočekávanou odpověď při vytváření nabídky.',
        },
        { status: 502 }
      );
    }

    const data = await backendRes.json().catch(() => null);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Prázdná odpověď z backendu.' },
        { status: 502 }
      );
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('POST /api/offers/create error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se vytvořit nabídku.' },
      { status: 500 }
    );
  }
}
