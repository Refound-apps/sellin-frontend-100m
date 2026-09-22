import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

export type ShopRecord = Database['public']['Tables']['shops']['Row'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainParam = searchParams.get('domain');
    const slugParam = searchParams.get('slug');
    const headerDomain = request.headers.get('x-shop-domain') || request.headers.get('host');

    const targetDomain = (domainParam || headerDomain || '').toLowerCase().trim().replace(/:\d+$/, '');
    const targetSlug = (slugParam || '').toLowerCase().trim();

    const supabase = await createClient();

    let query = supabase.from('shops').select('*').eq('is_active', true);

    const cleanTargetDomain = targetDomain.replace(/^www\./, '');

    if (targetSlug) {
      query = query.eq('slug', targetSlug);
    } else if (
      cleanTargetDomain &&
      !cleanTargetDomain.includes('localhost') &&
      !cleanTargetDomain.includes('sellin.cz') &&
      !cleanTargetDomain.includes('prodejomat.cz')
    ) {
      query = query.or(
        `custom_domain.ilike.${targetDomain},custom_domain.ilike.${cleanTargetDomain},slug.ilike.${cleanTargetDomain.split('.')[0]}`
      );
    } else if (targetSlug) {
      query = query.eq('slug', targetSlug);
    }

    const { data: shops, error } = await query.limit(1);

    if (error) {
      console.error('Error resolving shop:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let shop = shops && shops.length > 0 ? shops[0] : null;

    // Fallback: If not found, fetch the primary shop (e.g. slug = 'alubazar-plzen' or first active)
    if (!shop) {
      const { data: fallbackShops } = await supabase
        .from('shops')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fallbackShops && fallbackShops.length > 0) {
        shop = fallbackShops[0];
      }
    }

    if (!shop) {
      return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: shop,
    });
  } catch (err: unknown) {
    console.error('Error in shop resolve API:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst konfiguraci e-shopu.' },
      { status: 500 }
    );
  }
}
