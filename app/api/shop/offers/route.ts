import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { findShopByIdentity, shopInventoryEmails } from '@/lib/shop/resolveShop';

export const dynamic = 'force-dynamic';

/**
 * Public storefront catalog — no login required.
 * Inventory is always scoped to the resolved shop (never platform-wide).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
      .toLowerCase()
      .split(':')[0]
      .trim();
    const headerDomain = request.headers.get('x-shop-domain');

    const supabase = await createClient();
    const shop = await findShopByIdentity(supabase, {
      domain: searchParams.get('domain') || headerDomain,
      slug: searchParams.get('slug') || searchParams.get('shop'),
      host,
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    const allowed = new Set(shopInventoryEmails(shop));
    if (allowed.size === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        limit: 0,
        offset: 0,
      });
    }

    // Client may pass emails — only keep those belonging to this shop
    const requested = (searchParams.get('emails') || searchParams.get('sbazar_email') || '')
      .split(',')
      .map((e) => e.toLowerCase().trim())
      .filter(Boolean);

    const emails =
      requested.length > 0
        ? requested.filter((e) => allowed.has(e))
        : Array.from(allowed);

    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        limit: 0,
        offset: 0,
      });
    }

    const backendParams = new URLSearchParams();
    backendParams.set('emails', emails.join(','));

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10) || 24, 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    backendParams.set('limit', String(limit));
    backendParams.set('offset', String(offset));

    for (const key of ['search', 'type', 'season', 'width', 'profile', 'rim', 'brand', 'pcd', 'sort'] as const) {
      const v = searchParams.get(key);
      if (v) backendParams.set(key, v);
    }

    const backendRes = await backendFetch(`/api/shop/offers?${backendParams.toString()}`);
    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Chyba při komunikaci s backend serverem.' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('GET /api/shop/offers error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst nabídky e-shopu.' },
      { status: 500 }
    );
  }
}
