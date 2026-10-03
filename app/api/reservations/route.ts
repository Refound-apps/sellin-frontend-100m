import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set(['new', 'contacted', 'completed', 'cancelled']);

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

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || '').trim().toLowerCase();
    const shopId = (searchParams.get('shop_id') || '').trim();

    let query = supabase
      .from('shop_reservations')
      .select(
        `
        id,
        shop_id,
        offer_id,
        offer_title,
        offer_price,
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        pickup,
        note,
        status,
        created_at,
        updated_at,
        shops (
          id,
          shop_name,
          slug,
          custom_domain
        )
      `
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (status && VALID_STATUSES.has(status)) {
      query = query.eq('status', status);
    }
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('GET /api/reservations error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('GET /api/reservations error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
