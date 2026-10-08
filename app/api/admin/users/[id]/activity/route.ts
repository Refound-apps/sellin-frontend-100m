import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

type ActivityItem = {
  id: string;
  at: string;
  kind: string;
  label: string;
  status: string | null;
  detail: string | null;
  source: 'scraper_job' | 'auth' | 'offer';
};

function normEmail(v: unknown): string {
  return String(v || '')
    .toLowerCase()
    .trim();
}

function jobLabel(jobType: string): string {
  const map: Record<string, string> = {
    create_offer: 'Vytvoření nabídky',
    update_offer: 'Úprava nabídky',
    delete_offer: 'Smazání nabídky',
    renew_offer: 'Obnovení nabídky',
    top_offer: 'Topování nabídky',
    recreate_offer: 'Znovuvytvoření nabídky',
    force_renew: 'Force renew',
  };
  return map[jobType] || jobType.replace(/_/g, ' ');
}

function extractJobTitle(payload: any): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [
    payload?.offer?.title,
    payload?.offerDetail?.title,
    payload?.offerDetail?.bb_nadpis,
    payload?.data?.offer?.title,
    payload?.title,
  ];
  for (const c of candidates) {
    const s = String(c || '').trim();
    if (s) return s.length > 90 ? `${s.slice(0, 87)}…` : s;
  }
  return null;
}

function jobTouchesCredential(job: any, emails: Set<string>, credentialId: number): boolean {
  const ak = normEmail(job.account_key).replace(/^[^:]+:/, ''); // strip prefix for email compare later
  const fullAk = String(job.account_key || '').toLowerCase();
  for (const email of emails) {
    if (fullAk === `email:${email}` || fullAk === `sbazar:${email}`) return true;
    if (ak === email) return true;
  }

  const payload = job.payload;
  if (!payload || typeof payload !== 'object') return false;

  const blob = JSON.stringify(payload).toLowerCase();
  if (blob.includes(`"id":${credentialId}`) || blob.includes(`"id": ${credentialId}`)) return true;
  for (const email of emails) {
    if (blob.includes(email)) return true;
  }
  return false;
}

/** GET /api/admin/users/:id/activity — recent app actions for a credential */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const { supabase } = auth;

    const { id: idParam } = await params;
    const credentialId = Number(idParam);
    if (!Number.isFinite(credentialId) || credentialId <= 0) {
      return NextResponse.json({ success: false, error: 'Neplatné ID' }, { status: 400 });
    }

    const { data: cred, error: credErr } = await supabase
      .from('credential_pg')
      .select('id, email, sbazar_email, bazos_email, facebook_email, user_id')
      .eq('id', credentialId)
      .maybeSingle();

    if (credErr) {
      return NextResponse.json({ success: false, error: credErr.message }, { status: 500 });
    }
    if (!cred) {
      return NextResponse.json({ success: false, error: 'Uživatel nenalezen' }, { status: 404 });
    }

    const emails = [
      cred.email,
      cred.sbazar_email,
      cred.bazos_email,
      cred.facebook_email,
    ]
      .map(normEmail)
      .filter(Boolean);
    const emailSet = new Set(emails);

    // Sibling credentials in same sbazar group → richer timeline for the seller
    let groupEmails = [...emails];
    const sbazar = normEmail(cred.sbazar_email);
    if (sbazar) {
      const { data: siblings } = await supabase
        .from('credential_pg')
        .select('email, sbazar_email, bazos_email')
        .ilike('sbazar_email', sbazar)
        .limit(80);
      for (const s of siblings || []) {
        for (const e of [s.email, s.sbazar_email, s.bazos_email].map(normEmail)) {
          if (e) groupEmails.push(e);
        }
      }
    }
    groupEmails = [...new Set(groupEmails)];

    const accountKeys = groupEmails.flatMap((e) => [`email:${e}`, `sbazar:${e}`]);
    const items: ActivityItem[] = [];

    // Scraper / app jobs
    if (accountKeys.length > 0) {
      const orFilter = accountKeys.map((k) => `account_key.eq.${k}`).join(',');
      const { data: jobs, error: jobsErr } = await (supabase as any)
        .from('scraper_jobs')
        .select('id, job_type, status, account_key, created_at, finished_at, last_error, payload')
        .or(orFilter)
        .order('created_at', { ascending: false })
        .limit(60);

      if (jobsErr) {
        console.error('[admin/users/activity] jobs:', jobsErr);
      } else {
        for (const job of jobs || []) {
          // Prefer jobs that touch this credential; still keep group sbazar jobs
          const touches = jobTouchesCredential(job, emailSet, credentialId);
          const isGroupSbazar =
            sbazar && String(job.account_key || '').toLowerCase() === `sbazar:${sbazar}`;
          if (!touches && !isGroupSbazar) continue;

          const title = extractJobTitle(job.payload);
          const when = job.finished_at || job.created_at;
          items.push({
            id: `job-${job.id}`,
            at: when,
            kind: job.job_type,
            label: jobLabel(String(job.job_type || '')),
            status: job.status || null,
            detail: [title, job.account_key, job.last_error ? `chyba: ${String(job.last_error).slice(0, 80)}` : null]
              .filter(Boolean)
              .join(' · '),
            source: 'scraper_job',
          });
        }
      }
    }

    // Offers saved in app (complements jobs; useful when few scraper jobs)
    if (groupEmails.length > 0) {
      const { data: offers, error: offersErr } = await supabase
        .from('offer_pg')
        .select('"auto id", title, created_at, state, bb_email')
        .in('bb_email', groupEmails)
        .order('created_at', { ascending: false })
        .limit(20);

      if (offersErr) {
        console.error('[admin/users/activity] offers:', offersErr);
      } else {
        for (const offer of offers || []) {
          const row = offer as any;
          const oid = row['auto id'];
          const title = String(row.title || '').trim();
          items.push({
            id: `offer-${oid}`,
            at: row.created_at,
            kind: 'offer_saved',
            label: 'Uložení nabídky v app',
            status: row.state || 'saved',
            detail: [title ? (title.length > 90 ? `${title.slice(0, 87)}…` : title) : null, row.bb_email]
              .filter(Boolean)
              .join(' · '),
            source: 'offer',
          });
        }
      }
    }

    // Auth login
    if (cred.user_id) {
      try {
        const { data: rpcLogins } = await (supabase as any).rpc('admin_list_auth_logins');
        const match = Array.isArray(rpcLogins)
          ? rpcLogins.find(
              (r: any) =>
                String(r.user_id) === String(cred.user_id) ||
                (r.email && emailSet.has(normEmail(r.email)))
            )
          : null;
        if (match?.last_sign_in_at) {
          items.push({
            id: `auth-${cred.user_id}`,
            at: match.last_sign_in_at,
            kind: 'login',
            label: 'Přihlášení do app',
            status: 'ok',
            detail: match.email || cred.email,
            source: 'auth',
          });
        }
      } catch (e) {
        console.error('[admin/users/activity] auth login:', e);
      }
    }

    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const limited = items.slice(0, 50);

    return NextResponse.json({
      success: true,
      data: limited,
      meta: {
        credentialId,
        emails: groupEmails,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
