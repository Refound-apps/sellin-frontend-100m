import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createWriter() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createServiceClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

/** Public storefront ping — increments today's visit counter for a shop. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shopId = typeof body?.shop_id === 'string' ? body.shop_id.trim() : '';

    if (!shopId || !UUID_RE.test(shopId)) {
      return NextResponse.json({ success: false, error: 'Neplatné shop_id' }, { status: 400 });
    }

    const writer = createWriter() ?? (await createClient());
    const { error } = await writer.rpc('increment_shop_visit', { p_shop_id: shopId });

    if (error) {
      console.error('POST /api/shop/visit error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('POST /api/shop/visit error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
