import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type ReservationUpdate = Database['public']['Tables']['shop_reservations']['Update'];

const VALID_STATUSES = new Set(['new', 'contacted', 'completed', 'cancelled']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID rezervace.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const body = await request.json();
    const status = String(body?.status || '').trim().toLowerCase();
    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { success: false, error: 'Neplatný stav rezervace.' },
        { status: 400 }
      );
    }

    const updates: ReservationUpdate = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('shop_reservations')
      .update(updates)
      .eq('id', id)
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
      .maybeSingle();

    if (error) {
      console.error('PATCH /api/reservations/[id] error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Rezervace nenalezena nebo nemáte oprávnění.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('PATCH /api/reservations/[id] error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
