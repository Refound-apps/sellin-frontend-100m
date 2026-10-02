import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScraperActionUrl } from '@/lib/backend';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET || 'sellin-cron-secret-2026';

function isCronSecretAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  return (
    authHeader === `Bearer ${CRON_SECRET}` ||
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Neautorizováno' };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  if (!userCreds || userCreds.length === 0) {
    return { ok: false as const, status: 403, error: 'Vyžaduje administrátora' };
  }

  return { ok: true as const };
}

/**
 * Spustí automatizaci přes backend cron-runner (stejná logika jako schedule).
 * FE Automatizace → POST { id } → backend /cron/run.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID úlohy' }, { status: 400 });
    }

    const cronAuth = isCronSecretAuth(request);
    if (!cronAuth) {
      const admin = await requireAdmin();
      if (!admin.ok) {
        return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
      }
    }

    const triggeredBy =
      cronAuth && body?.triggered_by === 'cron' ? 'cron' : 'manual_admin';

    const backendUrl = getScraperActionUrl('/cron/run');
    const backendRes = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CRON_SECRET}`,
      },
      body: JSON.stringify({ id, triggered_by: triggeredBy }),
    });

    const payload = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            payload?.error ||
            `Backend cron/run vrátil ${backendRes.status} (${backendUrl})`,
        },
        { status: backendRes.status >= 400 ? backendRes.status : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: payload?.message || 'Úloha spuštěna na backendu',
      count: payload?.count,
      details: payload?.details,
    });
  } catch (err: any) {
    console.error('Error executing cron job via backend:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Chyba při spouštění úlohy' },
      { status: 500 }
    );
  }
}
