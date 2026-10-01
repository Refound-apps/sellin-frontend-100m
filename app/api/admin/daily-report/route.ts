import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadDailyReport, sendDailyReportEmail } from '@/lib/sendDailyReport';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: 'Neautorizováno', user: null };
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
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora', user: null };
  }

  return { isAdmin: true, error: null, user };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error: authError } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: authError }, { status: 403 });
    }

    const seller =
      request.nextUrl.searchParams.get('seller') ||
      request.nextUrl.searchParams.get('email') ||
      'duplux@seznam.cz';

    const payload = await loadDailyReport(supabase, seller);
    return NextResponse.json({
      success: true,
      report: payload.report,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err: any) {
    console.error('GET /api/admin/daily-report error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const seller = String(body?.seller || body?.email || 'duplux@seznam.cz').trim();
    const to = String(body?.to || body?.recipient || auth.user?.email || 'obchod@sellin.cz').trim();

    const sent = await sendDailyReportEmail({ supabase, seller, to });

    return NextResponse.json({
      success: true,
      id: sent.id,
      to: sent.to,
      subject: sent.subject,
      report: sent.report,
    });
  } catch (err: any) {
    console.error('POST /api/admin/daily-report error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
