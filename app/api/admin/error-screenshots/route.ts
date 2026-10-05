import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScraperActionUrl } from '@/lib/backend';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: 'Neautorizováno' };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  if (!userCreds || userCreds.length === 0) {
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, error: null };
}

// GET /api/admin/error-screenshots — proxy na VPS listing (/var/www/sellin)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    for (const key of ['limit', 'offset', 'platform', 'q'] as const) {
      const v = searchParams.get(key);
      if (v) qs.set(key, v);
    }
    if (!qs.has('limit')) qs.set('limit', '120');

    const backendUrl = `${getScraperActionUrl('/error-screenshots')}?${qs.toString()}`;
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const payload = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            payload?.error ||
            `Backend error-screenshots vrátil ${backendRes.status} (${backendUrl})`,
        },
        { status: backendRes.status >= 400 ? backendRes.status : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payload?.data || [],
      total: payload?.total ?? 0,
      limit: payload?.limit,
      offset: payload?.offset,
      baseUrl: payload?.baseUrl || 'https://error.sellin.cz',
    });
  } catch (err: any) {
    console.error('GET /api/admin/error-screenshots error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Načtení screenshotů selhalo' },
      { status: 500 }
    );
  }
}
