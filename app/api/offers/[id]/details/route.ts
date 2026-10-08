import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

/**
 * GET /api/offers/:bbOfferId/details — marketplace detail rows for an offer.
 * Auth required; sellers only for their own / subaccount offers.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bbOfferId } = await params;
    if (!bbOfferId) {
      return NextResponse.json({ success: false, error: 'Chybí ID nabídky' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);

    if (!isAdmin) {
      // Resolve owner via offer list filter / direct lookup by bb_id through backend
      // Prefer numeric id path when possible; otherwise fetch details then check via offer_pg
      const { data: offerRow } = await supabase
        .from('offer_pg')
        .select('bb_email, bb_id')
        .eq('bb_id', bbOfferId)
        .limit(1)
        .maybeSingle();

      const owner = (offerRow?.bb_email || '').toLowerCase().trim();
      if (!owner || !allowedEmails.includes(owner)) {
        return NextResponse.json(
          { success: false, error: 'Nemáte přístup k této nabídce' },
          { status: 403 }
        );
      }
    }

    const backendRes = await backendFetch(
      `/api/offers/${encodeURIComponent(bbOfferId)}/details`
    );
    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('GET /api/offers/[id]/details error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst detaily nabídky.' },
      { status: 500 }
    );
  }
}
