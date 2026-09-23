import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

export type ShopRecord = Database['public']['Tables']['shops']['Row'];

function sanitizeCustomDomain(domainStr?: string | null): string | null {
  if (!domainStr) return null;
  let clean = domainStr.trim().toLowerCase();
  clean = clean.replace(/^(?:https?:\/\/)?/, '');
  clean = clean.replace(/\/.*$/, '');
  clean = clean.replace(/:\d+$/, '');
  clean = clean.replace(/^\.+|\.+$/g, '');
  return clean || null;
}

function sanitizeSlug(rawSlug?: string | null, fallback: string = 'shop'): string {
  if (!rawSlug) return fallback;
  return (
    rawSlug
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}

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

    const userEmail = (user.email || '').toLowerCase().trim();

    // Check if user is admin
    const { data: userCreds } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
      .eq('role', 'admin')
      .limit(1);

    const isAdmin = Boolean(userCreds && userCreds.length > 0);

    const { searchParams } = new URL(request.url);
    const requestedShopId = searchParams.get('shop_id');
    const requestedSeller = searchParams.get('seller') || searchParams.get('account') || searchParams.get('owner_email');

    let shop: ShopRecord | null = null;
    let allShops: Array<{
      id: string;
      shop_name: string;
      slug: string;
      custom_domain: string | null;
      owner_email: string;
      is_active: boolean;
    }> = [];
    let sellerAccounts: Array<{ email: string; name: string | null; phone: string | null }> = [];

    if (isAdmin) {
      // 1. Admin can see all shops in the system
      const { data: allShopsData } = await supabase
        .from('shops')
        .select('id, shop_name, slug, custom_domain, owner_email, is_active')
        .order('created_at', { ascending: true });

      allShops = (allShopsData as any[]) || [];

      if (requestedShopId) {
        const { data: requestedShop } = await supabase
          .from('shops')
          .select('*')
          .eq('id', requestedShopId)
          .limit(1);
        if (requestedShop && requestedShop.length > 0) {
          shop = requestedShop[0];
        }
      } else if (requestedSeller) {
        const cleanSeller = requestedSeller.toLowerCase().trim();
        const { data: requestedShopBySeller } = await supabase
          .from('shops')
          .select('*')
          .or(`owner_email.ilike.${cleanSeller},slug.ilike.${cleanSeller}`)
          .limit(1);
        if (requestedShopBySeller && requestedShopBySeller.length > 0) {
          shop = requestedShopBySeller[0];
        }
      }

      // If no specific shop was requested or not found, check if admin has their own shop,
      // otherwise fallback to the primary/first shop (e.g. Duplux / Alubazar)
      if (!shop) {
        const { data: myShops } = await supabase
          .from('shops')
          .select('*')
          .or(`user_id.eq.${user.id},owner_email.ilike.${userEmail}`)
          .limit(1);

        if (myShops && myShops.length > 0) {
          shop = myShops[0];
        } else if (allShops.length > 0) {
          const { data: firstShop } = await supabase
            .from('shops')
            .select('*')
            .eq('id', allShops[0].id)
            .limit(1);
          if (firstShop && firstShop.length > 0) {
            shop = firstShop[0];
          }
        }
      }

      // Collect distinct seller accounts from credential_pg and shops
      const { data: distinctCreds } = await supabase
        .from('credential_pg')
        .select('email, sbazar_email, bazos_name, telephone1')
        .order('email', { ascending: true });

      const sellersMap = new Map<string, { email: string; name: string | null; phone: string | null }>();

      for (const s of allShops) {
        if (s.owner_email && !sellersMap.has(s.owner_email.toLowerCase())) {
          sellersMap.set(s.owner_email.toLowerCase(), {
            email: s.owner_email,
            name: s.shop_name,
            phone: null,
          });
        }
      }

      for (const c of (distinctCreds || [])) {
        if (c.email) {
          const em = c.email.toLowerCase().trim();
          if (!sellersMap.has(em)) {
            sellersMap.set(em, {
              email: c.email,
              name: c.bazos_name || null,
              phone: c.telephone1 || null,
            });
          }
        }
        if (c.sbazar_email) {
          const sem = c.sbazar_email.toLowerCase().trim();
          if (!sellersMap.has(sem)) {
            sellersMap.set(sem, {
              email: c.sbazar_email,
              name: c.bazos_name || null,
              phone: c.telephone1 || null,
            });
          }
        }
      }

      sellerAccounts = Array.from(sellersMap.values());
    } else {
      // Non-admin seller: fetch only their shop
      const { data: userShops, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .or(`user_id.eq.${user.id},owner_email.ilike.${userEmail}`)
        .limit(1);

      if (shopError) {
        console.error('Error fetching user shop:', shopError);
        return NextResponse.json({ success: false, error: shopError.message }, { status: 500 });
      }

      shop = userShops && userShops.length > 0 ? userShops[0] : null;
      if (shop) {
        allShops = [
          {
            id: shop.id,
            shop_name: shop.shop_name,
            slug: shop.slug,
            custom_domain: shop.custom_domain,
            owner_email: shop.owner_email,
            is_active: shop.is_active,
          },
        ];
      }
    }

    // Fetch credentials / linked accounts
    let credentials: any[] = [];
    if (isAdmin) {
      // For admin, fetch all credentials so they can manage any shop's accounts
      const { data: allCreds } = await supabase
        .from('credential_pg')
        .select('id, email, sbazar_email, bazos_email, bazos_name, telephone1, location, role')
        .order('bazos_name', { ascending: true });
      credentials = allCreds || [];
    } else {
      const { data: userCredsData } = await supabase
        .from('credential_pg')
        .select('id, email, sbazar_email, bazos_email, bazos_name, telephone1, location, role')
        .or(`user_id.eq.${user.id},email.ilike.${userEmail},sbazar_email.ilike.${userEmail},bazos_email.ilike.${userEmail}`);
      credentials = userCredsData || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        shop,
        allShops,
        isAdmin,
        availableCredentials: credentials,
        sellerAccounts,
      },
    });
  } catch (err: unknown) {
    console.error('Error in GET /api/user/shop:', err);
    return NextResponse.json(
      { success: false, error: 'Chyba serveru při načítání e-shopu.' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const userEmail = (user.email || '').toLowerCase().trim();

    // Check if user is admin
    const { data: userCreds } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
      .eq('role', 'admin')
      .limit(1);

    const isAdmin = Boolean(userCreds && userCreds.length > 0);

    // 1. Identify target shop (by ID if provided, otherwise find user's shop)
    let existingShop: ShopRecord | null = null;
    if (body.id) {
      const { data: shopById } = await supabase
        .from('shops')
        .select('*')
        .eq('id', body.id)
        .limit(1);

      if (shopById && shopById.length > 0) {
        existingShop = shopById[0];
      }
    }

    if (!existingShop && !body.is_new) {
      if (!isAdmin) {
        const { data: userShops } = await supabase
          .from('shops')
          .select('*')
          .or(`user_id.eq.${user.id},owner_email.ilike.${userEmail}`)
          .limit(1);

        if (userShops && userShops.length > 0) {
          existingShop = userShops[0];
        }
      } else if (body.owner_email) {
        const cleanOwner = body.owner_email.trim().toLowerCase();
        const { data: clientShops } = await supabase
          .from('shops')
          .select('*')
          .ilike('owner_email', cleanOwner)
          .limit(1);
        if (clientShops && clientShops.length > 0) {
          existingShop = clientShops[0];
        }
      }
    }

    // Security check: non-admin can only update their own shop
    if (existingShop && !isAdmin) {
      const isOwner =
        existingShop.user_id === user.id ||
        existingShop.owner_email.toLowerCase() === userEmail;

      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Nemáte oprávnění upravovat tento e-shop.' },
          { status: 403 }
        );
      }
    }

    // 2. Sanitize inputs
    const cleanCustomDomain = sanitizeCustomDomain(body.custom_domain);
    const rawSlug = body.slug || body.shop_name || existingShop?.slug || 'shop';
    const slug = sanitizeSlug(rawSlug, 'shop');

    // 3. Domain conflict check
    if (cleanCustomDomain) {
      let domainQuery = supabase
        .from('shops')
        .select('id, shop_name')
        .ilike('custom_domain', cleanCustomDomain);

      if (existingShop) {
        domainQuery = domainQuery.neq('id', existingShop.id);
      }

      const { data: domainConflicts } = await domainQuery.limit(1);
      if (domainConflicts && domainConflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Vlastní doména "${cleanCustomDomain}" je již přiřazena k e-shopu "${domainConflicts[0].shop_name}". Zvolte prosím jinou doménu.`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Slug conflict check
    if (slug) {
      let slugQuery = supabase
        .from('shops')
        .select('id, shop_name')
        .eq('slug', slug);

      if (existingShop) {
        slugQuery = slugQuery.neq('id', existingShop.id);
      }

      const { data: slugConflicts } = await slugQuery.limit(1);
      if (slugConflicts && slugConflicts.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Systémová subdoména "${slug}.prodejomat.cz" je již obsazena e-shopem "${slugConflicts[0].shop_name}". Zvolte prosím jinou.`,
          },
          { status: 400 }
        );
      }
    }

    // 5. Construct payload
    const targetUserId = existingShop ? existingShop.user_id : (isAdmin ? null : user.id);
    const targetOwnerEmail = (isAdmin && body.owner_email?.trim())
      ? body.owner_email.trim().toLowerCase()
      : (existingShop?.owner_email || userEmail);

    const payload = {
      user_id: targetUserId,
      owner_email: targetOwnerEmail,
      slug,
      custom_domain: cleanCustomDomain,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      linked_credential_emails: Array.isArray(body.linked_credential_emails)
        ? body.linked_credential_emails
        : (existingShop?.linked_credential_emails || []),
      shop_name: body.shop_name?.trim() || existingShop?.shop_name || 'Můj E-shop',
      tagline: body.tagline !== undefined ? (body.tagline?.trim() || null) : existingShop?.tagline,
      phone: body.phone !== undefined ? (body.phone?.trim() || null) : existingShop?.phone,
      phone_href: body.phone ? body.phone.replace(/\s+/g, '') : (existingShop?.phone_href || null),
      email: body.email?.trim() || existingShop?.email || targetOwnerEmail,
      owner_name: body.owner_name !== undefined ? (body.owner_name?.trim() || null) : existingShop?.owner_name,
      ico: body.ico !== undefined ? (body.ico?.trim() || null) : existingShop?.ico,
      address_line: body.address_line !== undefined ? (body.address_line?.trim() || null) : existingShop?.address_line,
      address_city: body.address_city !== undefined ? (body.address_city?.trim() || null) : existingShop?.address_city,
      region: body.region !== undefined ? (body.region?.trim() || null) : existingShop?.region,
      opening_hours: body.opening_hours !== undefined ? (body.opening_hours?.trim() || null) : existingShop?.opening_hours,
      shipping_price: body.shipping_price !== undefined ? (body.shipping_price?.trim() || null) : existingShop?.shipping_price,
      shipping_price_tires: body.shipping_price_tires !== undefined ? (body.shipping_price_tires?.trim() || null) : existingShop?.shipping_price_tires,
      shipping_price_rims: body.shipping_price_rims !== undefined ? (body.shipping_price_rims?.trim() || null) : existingShop?.shipping_price_rims,
      map_link: body.map_link !== undefined ? (body.map_link?.trim() || null) : existingShop?.map_link,
      google_maps_link: body.google_maps_link !== undefined ? (body.google_maps_link?.trim() || null) : existingShop?.google_maps_link,
      caravan_url: body.caravan_url !== undefined ? (body.caravan_url?.trim() || null) : existingShop?.caravan_url,
      template_id: body.template_id || existingShop?.template_id || 'pneu-classic',
      primary_color: body.primary_color || existingShop?.primary_color || '#0f172a',
      logo_url: body.logo_url !== undefined ? (body.logo_url?.trim() || null) : existingShop?.logo_url,
      updated_at: new Date().toISOString(),
    };

    let resultData;
    if (existingShop) {
      const { data, error } = await supabase
        .from('shops')
        .update(payload)
        .eq('id', existingShop.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating shop:', error);
        return NextResponse.json(
          { success: false, error: `Chyba při ukládání: ${error.message}` },
          { status: 500 }
        );
      }
      resultData = data;
    } else {
      const { data, error } = await supabase
        .from('shops')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('Error creating shop:', error);
        return NextResponse.json(
          { success: false, error: `Chyba při zakládání: ${error.message}` },
          { status: 500 }
        );
      }
      resultData = data;
    }

    return NextResponse.json({
      success: true,
      data: resultData,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Chyba při ukládání konfigurace e-shopu.';
    console.error('Error in POST /api/user/shop:', err);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
