import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findShopByIdentity, toPublicShopDto } from '@/lib/shop/resolveShop';

export const dynamic = 'force-dynamic';

/**
 * Public shop resolve — must match a specific tenant (slug / domain / subdomain).
 * Never falls back to Duplux / "first active shop".
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get('domain');
    const slugParam = searchParams.get('slug') || searchParams.get('shop');
    const headerDomain = request.headers.get('x-shop-domain');
    const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
      .toLowerCase()
      .split(':')[0]
      .trim();

    const supabase = await createClient();
    const shop = await findShopByIdentity(supabase, {
      domain: domainParam || headerDomain,
      slug: slugParam,
      host,
    });

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: toPublicShopDto(shop),
    });
  } catch (err: unknown) {
    console.error('Error in shop resolve API:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst konfiguraci e-shopu.' },
      { status: 500 }
    );
  }
}
