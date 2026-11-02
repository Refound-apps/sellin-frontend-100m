import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, user: null, error: 'Neautorizováno' };
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
    return { isAdmin: false, user, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, user, error: null };
}

function pragueWindows(): { today: string; weekStart: string; monthStart: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const today = formatter.format(new Date()); // YYYY-MM-DD
  const [y, m, d] = today.split('-').map(Number);
  const todayDate = new Date(Date.UTC(y, m - 1, d));
  const weekDate = new Date(todayDate);
  weekDate.setUTCDate(weekDate.getUTCDate() - 6);
  const weekStart = weekDate.toISOString().slice(0, 10);
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`;
  return { today, weekStart, monthStart };
}

/** Admin: daily / weekly / monthly visit counters for prodejomat.cz */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error: adminError } = await checkAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: adminError || 'Přístup odepřen' }, { status: 403 });
    }

    const { today, weekStart, monthStart } = pragueWindows();
    const fromDay = monthStart < weekStart ? monthStart : weekStart;

    const { data, error } = await supabase
      .from('prodejomat_visit_daily')
      .select('day, visits')
      .gte('day', fromDay)
      .order('day', { ascending: false });

    if (error) {
      console.error('GET /api/admin/prodejomat-visits error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let day = 0;
    let week = 0;
    let month = 0;

    const rows = data || [];
    for (const row of rows) {
      const visits = Number(row.visits) || 0;
      if (row.day === today) day += visits;
      if (row.day >= weekStart) week += visits;
      if (row.day >= monthStart) month += visits;
    }

    return NextResponse.json({
      success: true,
      data: {
        day,
        week,
        month,
        history: rows.slice(0, 14),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('GET /api/admin/prodejomat-visits error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
