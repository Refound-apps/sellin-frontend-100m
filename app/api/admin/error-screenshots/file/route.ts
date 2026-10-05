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

// GET /api/admin/error-screenshots/file?name=bazos-create-1-….png
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

    const backendUrl = `${getScraperActionUrl('/error-screenshots/file')}?name=${encodeURIComponent(name)}`;
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      const payload = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: payload?.error || `Backend vrátil ${backendRes.status}`,
        },
        { status: backendRes.status >= 400 ? backendRes.status : 500 }
      );
    }

    const contentType = backendRes.headers.get('content-type') || 'image/png';
    const body = backendRes.body;
    if (!body) {
      const buf = await backendRes.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err: any) {
    console.error('GET /api/admin/error-screenshots/file error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Načtení obrázku selhalo' },
      { status: 500 }
    );
  }
}
