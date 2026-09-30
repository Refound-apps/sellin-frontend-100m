import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: any) {
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

function jobsTable(supabase: any) {
  // Table may not yet be in generated Database types
  return supabase.from('scraper_jobs' as any);
}

// GET /api/admin/scraper-jobs?status=&job_type=&limit=
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const jobType = searchParams.get('job_type');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 500);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let query = jobsTable(supabase)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (jobType && jobType !== 'all') {
      query = query.eq('job_type', jobType);
    }

    const { data, error: dbError, count: filteredTotal } = await query;
    if (dbError) {
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    // Accurate status counts for last 7 days (head-only count queries)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const counts = { pending: 0, running: 0, done: 0, failed: 0, cancelled: 0 };
    await Promise.all(
      (Object.keys(counts) as Array<keyof typeof counts>).map(async (key) => {
        const { count } = await jobsTable(supabase)
          .select('id', { count: 'exact', head: true })
          .eq('status', key)
          .gte('created_at', since);
        counts[key] = count || 0;
      })
    );

    return NextResponse.json({
      success: true,
      data: data || [],
      counts,
      meta: {
        limit,
        offset,
        filteredTotal: filteredTotal ?? (data || []).length,
        hasMore: offset + (data || []).length < (filteredTotal ?? 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/scraper-jobs  { id, action: 'cancel' | 'retry' }
// or { action: 'cancel_all_pending' }
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as string;

    if (action === 'cancel_all_pending') {
      const { data, error: dbError } = await jobsTable(supabase)
        .update({
          status: 'cancelled',
          finished_at: new Date().toISOString(),
          last_error: 'Cancelled by admin (bulk)',
        })
        .eq('status', 'pending')
        .select('id');

      if (dbError) {
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, cancelled: (data || []).length });
    }

    const id = body?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí id jobu' }, { status: 400 });
    }

    if (action === 'cancel') {
      const { data, error: dbError } = await jobsTable(supabase)
        .update({
          status: 'cancelled',
          finished_at: new Date().toISOString(),
          locked_at: null,
          locked_by: null,
          last_error: 'Cancelled by admin',
        })
        .eq('id', id)
        .in('status', ['pending', 'running'])
        .select('*')
        .maybeSingle();

      if (dbError) {
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Job nelze zrušit (není pending/running)' },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    if (action === 'retry') {
      const { data, error: dbError } = await jobsTable(supabase)
        .update({
          status: 'pending',
          run_after: new Date().toISOString(),
          finished_at: null,
          locked_at: null,
          locked_by: null,
          last_error: null,
          attempts: 0,
        })
        .eq('id', id)
        .in('status', ['failed', 'cancelled'])
        .select('*')
        .maybeSingle();

      if (dbError) {
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Retry jen pro failed/cancelled' },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: 'Neznámá akce' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
