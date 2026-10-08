import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

function createService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createServiceClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false as const, error: 'Neautorizováno' };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  if (!userCreds || userCreds.length === 0) {
    return { isAdmin: false as const, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true as const, error: null };
}

function blank(v: unknown): boolean {
  return v == null || String(v).trim() === '';
}

function cookieFlags(row: Record<string, unknown>) {
  return {
    has_bazos_bkod: !blank(row.bazos_bkod),
    has_bazos_sk_bkod: !blank(row.bazos_sk_bkod),
    has_sbazar_cookie: !blank(row.sbazar_cookie_ds),
    has_facebook_cookies: !blank(row.facebook_cuser) && !blank(row.facebook_xs),
    has_proxy: !blank(row.proxy_ip),
    has_proxy_sbazar: !blank(row.proxy_ip_sbazar),
  };
}

/** GET /api/admin/users — credentials + last login + scraper error counts */
export async function GET() {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const service = createService();
    const db = service || supabase;

    const { data: creds, error: credsError } = await db
      .from('credential_pg')
      .select('*')
      .order('id', { ascending: false });

    if (credsError) {
      return NextResponse.json({ success: false, error: credsError.message }, { status: 500 });
    }

    // Auth last_sign_in_at (service role) — fetch all pages
    const loginByUserId = new Map<string, string>();
    const loginByEmail = new Map<string, string>();
    if (service) {
      try {
        let page = 1;
        const perPage = 1000;
        while (page <= 50) {
          const { data, error: listErr } = await service.auth.admin.listUsers({ page, perPage });
          if (listErr) {
            console.error('[admin/users] listUsers page failed:', listErr);
            break;
          }
          const batch = data?.users || [];
          for (const u of batch) {
            const at = u.last_sign_in_at;
            if (!at) continue;
            loginByUserId.set(u.id, at);
            if (u.email) {
              loginByEmail.set(u.email.toLowerCase().trim(), at);
            }
          }
          if (batch.length < perPage) break;
          page += 1;
        }
      } catch (e) {
        console.error('[admin/users] listUsers failed:', e);
      }
    }

    function pickLatestLogin(...candidates: Array<string | null | undefined>): string | null {
      let best: string | null = null;
      let bestMs = 0;
      for (const c of candidates) {
        if (!c) continue;
        const ms = new Date(c).getTime();
        if (Number.isFinite(ms) && ms > bestMs) {
          bestMs = ms;
          best = c;
        }
      }
      return best;
    }

    function credEmailKeys(row: Record<string, unknown>): string[] {
      return [row.email, row.sbazar_email, row.bazos_email, row.facebook_email]
        .map((e) => String(e || '').toLowerCase().trim())
        .filter(Boolean);
    }

    // Scraper job errors (14 days) — each job increments each related email at most once
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const errorCountByEmail = new Map<string, number>();

    const emailsBySbazar = new Map<string, string[]>();
    for (const row of creds || []) {
      const email = String((row as any).email || '').toLowerCase().trim();
      const sbazar = String((row as any).sbazar_email || '').toLowerCase().trim();
      if (!email || !sbazar) continue;
      if (!emailsBySbazar.has(sbazar)) emailsBySbazar.set(sbazar, []);
      emailsBySbazar.get(sbazar)!.push(email);
    }

    const jobsTable = () => (db as any).from('scraper_jobs');
    const [{ data: failedJobs }, { data: retryJobs }] = await Promise.all([
      jobsTable()
        .select('id, account_key, status, last_error, payload')
        .eq('status', 'failed')
        .gte('created_at', since)
        .limit(1500),
      jobsTable()
        .select('id, account_key, status, last_error, payload')
        .in('status', ['pending', 'running'])
        .not('last_error', 'is', null)
        .gte('created_at', since)
        .limit(1500),
    ]);

    const allJobs = [...((failedJobs || []) as any[]), ...((retryJobs || []) as any[])];
    const seenJobIds = new Set<number>();
    for (const job of allJobs) {
      const jobId = Number(job.id);
      if (seenJobIds.has(jobId)) continue;
      seenJobIds.add(jobId);

      const related = new Set<string>();
      const add = (email: string | null | undefined) => {
        const key = (email || '').toLowerCase().trim();
        if (key) related.add(key);
      };
      const addSbazarGroup = (sbazarEmail: string | null | undefined) => {
        const key = (sbazarEmail || '').toLowerCase().trim();
        if (!key) return;
        add(key);
        for (const member of emailsBySbazar.get(key) || []) add(member);
      };

      const ak = String(job.account_key || '').toLowerCase().trim();
      if (ak.startsWith('sbazar:')) addSbazarGroup(ak.slice('sbazar:'.length));
      else if (ak.startsWith('email:')) add(ak.slice('email:'.length));
      else if (ak && !ak.startsWith('tel:') && !ak.startsWith('proxy:')) add(ak);

      const p = job.payload || {};
      add(p?.offerDetail?.bb_email_od);
      add(p?.credential?.email);
      if (Array.isArray(p?.credentials)) {
        for (const c of p.credentials) add(c?.email || c?.bb_email_od);
      }

      for (const email of related) {
        errorCountByEmail.set(email, (errorCountByEmail.get(email) || 0) + 1);
      }
    }

    const rows = (creds || []).map((row: any) => {
      const email = String(row.email || '').toLowerCase().trim();
      const byUserId = row.user_id ? loginByUserId.get(String(row.user_id)) : null;
      const byEmails = credEmailKeys(row).map((e) => loginByEmail.get(e));
      const lastSignIn = pickLatestLogin(byUserId, ...byEmails);

      return {
        ...row,
        last_sign_in_at: lastSignIn,
        error_count: errorCountByEmail.get(email) || 0,
        cookies: cookieFlags(row),
      };
    });

    // Newest login first (UI also groups/sorts; API order helps debugging + other consumers)
    rows.sort((a: any, b: any) => {
      const aMs = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const bMs = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      if (bMs !== aMs) return bMs - aMs;
      return String(a.email || '').localeCompare(String(b.email || ''), 'cs');
    });

    return NextResponse.json({
      success: true,
      data: rows,
      meta: {
        windowDays: 14,
        authLoginsAvailable: loginByUserId.size > 0 || loginByEmail.size > 0,
        authUsersWithLogin: loginByUserId.size,
        authEmailsWithLogin: loginByEmail.size,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
