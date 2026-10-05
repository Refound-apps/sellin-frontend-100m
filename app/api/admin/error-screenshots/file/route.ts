import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScraperActionUrl } from '@/lib/backend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

/**
 * Stream screenshot from VPS disk via backend.
 * Uses the same /error-screenshots path as listing (?file=) — nginx-safe.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const name = new URL(request.url).searchParams.get('name') || '';
    if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
      return NextResponse.json({ success: false, error: 'Neplatný název souboru' }, { status: 400 });
    }

    // Primary: same endpoint as listing (already proven reachable in prod)
    const primaryUrl = `${getScraperActionUrl('/error-screenshots')}?file=${encodeURIComponent(name)}`;
    let backendRes = await fetch(primaryUrl, { method: 'GET', cache: 'no-store' });

    // Fallback for older backend deploys
    if (!backendRes.ok && backendRes.status === 404) {
      const fallbackUrl = `${getScraperActionUrl('/error-screenshots/file')}?name=${encodeURIComponent(name)}`;
      backendRes = await fetch(fallbackUrl, { method: 'GET', cache: 'no-store' });
    }

    if (!backendRes.ok) {
      const payload = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: payload?.error || `Backend vrátil ${backendRes.status} pro ${name}`,
        },
        { status: backendRes.status >= 400 ? backendRes.status : 500 }
      );
    }

    const contentType = backendRes.headers.get('content-type') || 'image/png';
    // Old backend without ?file= returns JSON 200 — don't feed that to <img>
    if (contentType.includes('application/json') || contentType.includes('text/')) {
      const payload = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error:
            payload?.error ||
            'Backend nevrátil obrázek z disku. Restartuj scraper na VPS s novým /error-screenshots?file=…',
        },
        { status: 502 }
      );
    }

    const buf = await backendRes.arrayBuffer();

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType.startsWith('image/') ? contentType : 'image/png',
        'Cache-Control': 'private, max-age=300',
        'Content-Length': String(buf.byteLength),
      },
    });
  } catch (err: any) {
    console.error('GET /api/admin/error-screenshots/file error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Načtení obrázku z disku selhalo' },
      { status: 500 }
    );
  }
}
