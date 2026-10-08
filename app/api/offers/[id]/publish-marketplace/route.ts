import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

/** Proxy: seller can queue marketplace publish only for their own / subaccount offers. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      const offerRes = await backendFetch(`/api/offers/${id}`);
      const offerPayload = await offerRes.json().catch(() => null);
      const offer = offerPayload?.data ?? offerPayload;
      const owner = offer?.bb_email?.toLowerCase().trim();

      if (!offerRes.ok || !owner || !allowedEmails.includes(owner)) {
        return NextResponse.json(
          { success: false, error: 'Nemáte přístup k této nabídce' },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));

    const backendRes = await backendFetch(`/api/offers/${id}/publish-marketplace`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('Error proxying offer publish-marketplace:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}
