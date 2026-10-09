import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';

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

  const isAdmin = Boolean(userCreds && userCreds.length > 0);
  if (!isAdmin) {
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, error: null };
}

/**
 * POST /api/admin/reap-browsers
 * Proxy na VPS: zabije hung Chromium/Firefox procesy.
 * Body: { maxAgeSeconds?: number, forceAll?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const maxAgeSeconds = Math.max(10, Number(body?.maxAgeSeconds) || 1800);
    const forceAll = Boolean(body?.forceAll);

    const backendRes = await backendFetch('/api/admin/reap-browsers', {
      method: 'POST',
      body: JSON.stringify({ maxAgeSeconds, forceAll }),
    });

    const backendBody = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            backendBody?.error ||
            `Backend reap-browsers selhal (${backendRes.status})`,
        },
        { status: backendRes.status || 502 }
      );
    }

    return NextResponse.json({
      success: true,
      killed: backendBody.killed ?? 0,
      details: backendBody.details ?? [],
      maxAgeSeconds,
      forceAll,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('POST /api/admin/reap-browsers error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
