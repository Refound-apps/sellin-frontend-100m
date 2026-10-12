import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

function normEmail(email: unknown): string {
  return String(email || '')
    .toLowerCase()
    .trim();
}

function normalizeDetailRow(row: any) {
  if (!row || typeof row !== 'object') return row;
  const autoId = Number(row.id ?? row['auto id'] ?? row.auto_id ?? 0);
  return {
    ...row,
    id: Number.isFinite(autoId) && autoId > 0 ? autoId : row.id,
    'auto id': row['auto id'] ?? (Number.isFinite(autoId) && autoId > 0 ? autoId : undefined),
  };
}

/**
 * GET /api/offers/:bbOfferId/details — marketplace detail rows for an offer.
 * Auth required; sellers only for their own / subaccount offers.
 *
 * Important: do NOT require a readable offer_pg row via Supabase RLS before
 * fetching details — sellers often can't SELECT offer_pg but can see offers
 * via the backend list. Authorize from detail emails / optional supabase row.
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

    // Fetch details first (backend has the truth for portal links / conditions)
    const backendRes = await backendFetch(
      `/api/offers/${encodeURIComponent(bbOfferId)}/details`
    );
    const payload = await backendRes.json().catch(() => null);
    const rawDetails = Array.isArray(payload?.data) ? payload.data : [];
    const details = rawDetails.map(normalizeDetailRow);

    if (!backendRes.ok) {
      return NextResponse.json(
        payload || { success: false, error: 'Nepodařilo se načíst detaily nabídky.' },
        { status: backendRes.status }
      );
    }

    if (!isAdmin) {
      const { data: offerRow } = await supabase
        .from('offer_pg')
        .select('bb_email, bb_id')
        .eq('bb_id', bbOfferId)
        .limit(1)
        .maybeSingle();

      const owners = new Set<string>();
      const fromOffer = normEmail(offerRow?.bb_email);
      if (fromOffer) owners.add(fromOffer);
      for (const d of details) {
        const e = normEmail(d?.bb_email_od || d?.bb_email);
        if (e) owners.add(e);
      }

      const allowed = [...owners].some((e) => allowedEmails.includes(e));
      if (!allowed) {
        return NextResponse.json(
          { success: false, error: 'Nemáte přístup k této nabídce' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: details });
  } catch (err: unknown) {
    console.error('GET /api/offers/[id]/details error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst detaily nabídky.' },
      { status: 500 }
    );
  }
}
