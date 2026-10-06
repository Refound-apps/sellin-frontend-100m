import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

/** Auth: daily / weekly / monthly shop visit counters. */
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

    const shopId = (new URL(request.url).searchParams.get('shop_id') || '').trim();
    const { today, weekStart, monthStart } = pragueWindows();
    const fromDay = monthStart < weekStart ? monthStart : weekStart;

    let query = supabase
      .from('shop_visit_daily')
      .select('day, visits')
      .gte('day', fromDay);

    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('GET /api/shop/visits error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let day = 0;
    let week = 0;
    let month = 0;

    for (const row of data || []) {
      const visits = Number(row.visits) || 0;
      if (row.day === today) day += visits;
      if (row.day >= weekStart) week += visits;
      if (row.day >= monthStart) month += visits;
    }

    return NextResponse.json({
      success: true,
      data: { day, week, month },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('GET /api/shop/visits error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
