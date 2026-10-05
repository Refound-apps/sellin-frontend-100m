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
  return supabase.from('scraper_jobs' as any);
}

function isBlank(v: unknown): boolean {
  return v == null || String(v).trim() === '';
}

// GET /api/admin/errors — scraping + cron errors, stuck jobs, missing cookies
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 300);

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const stuckBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const [
      failedRes,
      retryingRes,
      stuckRes,
      cronErrRes,
      credsRes,
      countsFailed,
      countsPendingErr,
      countsStuck,
    ] = await Promise.all([
      jobsTable(supabase)
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', since)
        .order('finished_at', { ascending: false, nullsFirst: false })
        .limit(limit),
      jobsTable(supabase)
        .select('*')
        .in('status', ['pending', 'running'])
        .not('last_error', 'is', null)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(limit),
      jobsTable(supabase)
        .select('*')
        .eq('status', 'running')
        .lt('locked_at', stuckBefore)
        .order('locked_at', { ascending: true })
        .limit(50),
      supabase
        .from('cron_job_logs')
        .select('*')
        .eq('status', 'error')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('credential_pg')
        .select(
          'id, email, bazos_email, sbazar_email, bazos_bkod, bazos_sk_bkod, sbazar_cookie_ds, facebook_cuser, facebook_xs, status_cz, status_sk, proxy_ip, proxy_ip_sbazar'
        )
        .order('email', { ascending: true }),
      jobsTable(supabase)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', since),
      jobsTable(supabase)
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'running'])
        .not('last_error', 'is', null)
        .gte('created_at', since),
      jobsTable(supabase)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'running')
        .lt('locked_at', stuckBefore),
    ]);

    if (failedRes.error) {
      return NextResponse.json({ success: false, error: failedRes.error.message }, { status: 500 });
    }
    if (retryingRes.error) {
      return NextResponse.json({ success: false, error: retryingRes.error.message }, { status: 500 });
    }

    const creds = credsRes.data || [];
    const missingCookies = creds
      .map((c: any) => {
        const issues: string[] = [];
        if (isBlank(c.bazos_bkod) && !isBlank(c.bazos_email)) issues.push('bazos_bkod');
        if (isBlank(c.bazos_sk_bkod) && String(c.status_sk || '').toUpperCase() === 'OK') {
          issues.push('bazos_sk_bkod');
        }
        if (isBlank(c.sbazar_cookie_ds) && !isBlank(c.sbazar_email)) issues.push('sbazar_cookie_ds');
        if (String(c.status_cz || '').toLowerCase().includes('not working')) {
          issues.push('status_cz=Not working');
        }
        if (String(c.status_sk || '').toLowerCase().includes('not working')) {
          issues.push('status_sk=Not working');
        }
        if (issues.length === 0) return null;
        return {
          id: c.id,
          email: c.email,
          bazos_email: c.bazos_email,
          sbazar_email: c.sbazar_email,
          status_cz: c.status_cz,
          status_sk: c.status_sk,
          issues,
        };
      })
      .filter(Boolean);

    // Group failed jobs by error signature for a quick overview
    const errorGroups: Record<string, { sample: string; count: number; account_keys: string[] }> = {};
    for (const job of failedRes.data || []) {
      const raw = String(job.last_error || 'unknown');
      const key = raw
        .replace(/#[0-9]+/g, '#N')
        .replace(/[0-9a-f]{8,}/gi, '…')
        .slice(0, 120);
      if (!errorGroups[key]) {
        errorGroups[key] = { sample: raw.slice(0, 300), count: 0, account_keys: [] };
      }
      errorGroups[key].count += 1;
      const ak = job.account_key || job.payload?.offerDetail?.bb_email_od || '';
      if (ak && !errorGroups[key].account_keys.includes(ak)) {
        errorGroups[key].account_keys.push(ak);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          failedJobs: countsFailed.count || 0,
          retryingWithError: countsPendingErr.count || 0,
          stuckRunning: countsStuck.count || 0,
          cronErrors: (cronErrRes.data || []).length,
          missingCookies: missingCookies.length,
          windowDays: 14,
        },
        errorGroups: Object.entries(errorGroups)
          .map(([signature, g]) => ({ signature, ...g }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 30),
        failedJobs: failedRes.data || [],
        retryingJobs: retryingRes.data || [],
        stuckJobs: stuckRes.data || [],
        cronErrors: cronErrRes.data || [],
        missingCookies,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
