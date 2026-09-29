import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

const EXCLUDED_CONDITIONS = ['error_delete', 'ok_deleted', 'error_create'] as const;

type Marketplace = 'Bazoš' | 'Bazoš.sk';

function parseMarketplace(value: unknown): Marketplace {
  return value === 'Bazoš.sk' ? 'Bazoš.sk' : 'Bazoš';
}

function forceEndpoint(marketplace: Marketplace): string {
  return marketplace === 'Bazoš.sk' ? '/renewofferbazosskforce' : '/renewofferbazosforce';
}

function orIlike(column: string, values: string[]): string {
  return values.map((v) => `${column}.ilike."${String(v).replace(/"/g, '')}"`).join(',');
}

/** Budibase "RENEW TILL TODAY": now±1min window going back 31000 minutes (~21.5 days). */
function renewTillTodayWindow() {
  const now = new Date();
  now.setSeconds(0, 0);
  const from = new Date(now.getTime() - 31000 * 60 * 1000);
  const to = new Date(now.getTime() + 1 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function emailLikePattern(email: string): string {
  const clean = email.replace(/%/g, '').trim();
  return `%${clean}%`;
}

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false as const, error: 'Neautorizováno', status: 401 };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  if (!userCreds || userCreds.length === 0) {
    return { isAdmin: false as const, error: 'Přístup odepřen: vyžaduje roli administrátora', status: 403 };
  }

  return { isAdmin: true as const, error: null, status: 200 };
}

function parseEmails(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((e) => String(e || '').trim()).filter(Boolean))];
  }
  const text = String(raw || '').trim();
  if (!text) return [];
  return [...new Set(text.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean))];
}

async function loadOfferDetailRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: {
    emails: string[];
    max: number;
    offset: number;
    marketplace: Marketplace;
    tillToday?: boolean;
  }
) {
  const { emails, max, offset, marketplace, tillToday } = opts;

  let query = supabase
    .from('offer_detail_pg')
    .select('*')
    .eq('bb_marketplace_id', marketplace)
    .not('condition', 'in', `(${EXCLUDED_CONDITIONS.join(',')})`)
    .order('next_date_renew', { ascending: true, nullsFirst: true })
    .range(offset, offset + Math.max(max, 1) - 1);

  // Budibase: bb_email_od LIKE '%{{email}}%' (prázdný email = %%)
  if (emails.length === 1) {
    query = query.ilike('bb_email_od', emailLikePattern(emails[0]));
  } else if (emails.length > 1) {
    query = query.or(
      emails.map((e) => `bb_email_od.ilike."${emailLikePattern(e).replace(/"/g, '')}"`).join(',')
    );
  }

  if (tillToday) {
    // Budibase RENEW TILL TODAY query
    const { from, to } = renewTillTodayWindow();
    query = query
      .neq('autorenew_freq', 'Neobnovovat')
      .gte('next_date_renew', from)
      .lte('next_date_renew', to);
  }

  const { data: details, error: detailsErr } = await query;
  if (detailsErr) {
    throw new Error(`Chyba načítání offer_detail_pg: ${detailsErr.message}`);
  }

  return details || [];
}

async function loadForceRenewCandidates(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: {
    emails: string[];
    max: number;
    offset: number;
    marketplace: Marketplace;
    tillToday?: boolean;
  }
) {
  const { emails } = opts;
  const items = await loadOfferDetailRows(supabase, opts);

  if (items.length === 0) {
    return { items: [] as any[], vouchers: [] as any[], creds: [] as any[] };
  }

  const offerIds = [...new Set(items.map((d) => d.bb_offer_id).filter(Boolean))] as string[];
  const detailEmails = [
    ...new Set(
      [
        ...emails,
        ...items.map((d) => (d.bb_email_od || '').trim()).filter(Boolean),
      ].map((e) => e.trim())
    ),
  ];

  const offersPromise =
    offerIds.length > 0
      ? supabase.from('offer_pg').select('bb_id, autotop, autorenew_freq, autorenewal').in('bb_id', offerIds)
      : Promise.resolve({ data: [] as any[] });

  // Credentials / vouchers: match by exact emails from DB rows (preferred) or input
  const credsPromise =
    detailEmails.length === 1
      ? supabase.from('credential_pg').select('*').ilike('email', detailEmails[0])
      : detailEmails.length > 1
        ? supabase.from('credential_pg').select('*').or(orIlike('email', detailEmails))
        : Promise.resolve({ data: [] as any[] });

  const vouchersPromise =
    detailEmails.length === 1
      ? supabase
          .from('voucher')
          .select('id, value, bb_email, used, is_valid')
          .eq('used', false)
          .eq('is_valid', true)
          .ilike('bb_email', detailEmails[0])
          .limit(Math.max(items.length * 3, 50))
      : detailEmails.length > 1
        ? supabase
            .from('voucher')
            .select('id, value, bb_email, used, is_valid')
            .eq('used', false)
            .eq('is_valid', true)
            .or(orIlike('bb_email', detailEmails))
            .limit(Math.max(items.length * 3, 50))
        : Promise.resolve({ data: [] as any[] });

  const [{ data: offers }, { data: creds }, { data: vouchers }] = await Promise.all([
    offersPromise,
    credsPromise,
    vouchersPromise,
  ]);

  const offerById = new Map((offers || []).map((o) => [o.bb_id, o]));
  const credByEmail = new Map(
    (creds || []).map((c) => [(c.email || '').toLowerCase().trim(), c])
  );

  // Flatten join fields like original Budibase SELECT * JOIN
  const enriched = items.map((detail) => {
    const offer = offerById.get(detail.bb_offer_id || '');
    const cred = credByEmail.get((detail.bb_email_od || '').toLowerCase().trim());
    return {
      ...detail,
      autotop: offer?.autotop ?? false,
      autorenew_freq: offer?.autorenew_freq ?? detail.autorenew_freq,
      bazos_top_max: cred?.bazos_top_max ?? 0,
      email: cred?.email ?? detail.bb_email_od,
      bazos_bkod: cred?.bazos_bkod ?? null,
      bazos_password: cred?.bazos_password ?? null,
      bazos_email: cred?.bazos_email ?? null,
      proxy_ip: cred?.proxy_ip ?? null,
      bazos_rewrite: cred?.bazos_rewrite ?? null,
      bazos_sk_bkod: cred?.bazos_sk_bkod ?? null,
    };
  });

  return {
    items: enriched,
    vouchers: vouchers || [],
    creds: creds || [],
  };
}

async function countTillToday(
  supabase: Awaited<ReturnType<typeof createClient>>,
  emails: string[],
  marketplace: Marketplace
) {
  const { from, to } = renewTillTodayWindow();

  let query = supabase
    .from('offer_detail_pg')
    .select('bb_offer_id', { count: 'exact', head: true })
    .eq('bb_marketplace_id', marketplace)
    .not('condition', 'in', `(${EXCLUDED_CONDITIONS.join(',')})`)
    .neq('autorenew_freq', 'Neobnovovat')
    .gte('next_date_renew', from)
    .lte('next_date_renew', to);

  if (emails.length === 1) {
    query = query.ilike('bb_email_od', emailLikePattern(emails[0]));
  } else if (emails.length > 1) {
    query = query.or(
      emails.map((e) => `bb_email_od.ilike."${emailLikePattern(e).replace(/"/g, '')}"`).join(',')
    );
  }

  const { count, error } = await query;
  if (error) throw new Error(`Chyba počítání: ${error.message}`);
  return count || 0;
}

/** Preview kandidátů k force renew (stejná logika jako Budibase RENEW - BAZOS). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const emails = parseEmails(searchParams.get('email') || searchParams.get('emails'));
    const max = Math.min(Math.max(Number(searchParams.get('max') || 50) || 50, 1), 10000);
    const offset = Math.max(Number(searchParams.get('offset') || 0) || 0, 0);
    const marketplace = parseMarketplace(searchParams.get('marketplace'));
    const tillToday = searchParams.get('tillToday') === '1' || searchParams.get('tillToday') === 'true';

    const [candidates, tillTodayCount] = await Promise.all([
      loadForceRenewCandidates(supabase, { emails, max, offset, marketplace, tillToday }),
      countTillToday(supabase, emails, marketplace),
    ]);

    return NextResponse.json({
      success: true,
      marketplace,
      emails,
      max,
      offset,
      tillToday,
      tillTodayCount,
      count: candidates.items.length,
      vouchersCount: candidates.vouchers.length,
      items: candidates.items.map((item) => ({
        auto_id: item['auto id'],
        bb_email_od: item.bb_email_od,
        next_date_renew: item.next_date_renew,
        last_date_renewed: item.last_date_renewed,
        condition: item.condition,
        link: item.link,
        bb_offer_id: item.bb_offer_id,
        autotop: item.autotop,
        autorenew_freq: item.autorenew_freq,
      })),
    });
  } catch (err: any) {
    console.error('GET /api/admin/force-renew error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}

/**
 * Spustí force renew — stejný flow jako Budibase:
 * 1) RENEW - BAZOS query (offer_detail + offer + credential)
 * 2) vouchers pro e-mail
 * 3) creds
 * 4) POST /renewofferbazosforce
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const emails = parseEmails(body?.email ?? body?.emails);
    const max = Math.min(Math.max(Number(body?.max ?? 10) || 10, 1), 500);
    const offset = Math.max(Number(body?.offset ?? 0) || 0, 0);
    const marketplace = parseMarketplace(body?.marketplace);

    if (emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zadej alespoň jeden e-mail účtu.' },
        { status: 400 }
      );
    }

    const { items, vouchers, creds } = await loadForceRenewCandidates(supabase, {
      emails,
      max,
      offset,
      marketplace,
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        started: false,
        message: `Nenalezeny žádné inzeráty k force renew pro ${emails.join(', ')} na ${marketplace}.`,
        count: 0,
      });
    }

    if (!creds.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Nenalezeny credentials pro ${emails.join(', ')}. Force renew nelze spustit.`,
        },
        { status: 400 }
      );
    }

    const voucherPayload = vouchers.map((v) => ({ value: v.value, bb_email: v.bb_email, id: v.id }));
    const endpoint = forceEndpoint(marketplace);
    const payload = {
      offerdetails: items,
      vouchers: JSON.stringify(voucherPayload),
      creds,
    };

    // Backend běží dlouho (náhodné pauzy mezi renew) — fire-and-forget po startu requestu
    const backendPromise = fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      console.error('Force renew backend call failed:', err);
    });

    // Krátce počkáme, jestli endpoint ihned neodmítne (síť / 4xx)
    const raced = await Promise.race([
      backendPromise.then(() => 'done' as const),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 2500)),
    ]);

    return NextResponse.json({
      success: true,
      started: true,
      message:
        raced === 'timeout'
          ? `Force renew zahájen na backendu (${items.length} inzerátů, ${voucherPayload.length} voucherů). Běží na pozadí.`
          : `Force renew odeslán na backend (${items.length} inzerátů).`,
      count: items.length,
      vouchersCount: voucherPayload.length,
      emails,
      marketplace,
      endpoint,
      sample: items.slice(0, 5).map((i) => ({
        auto_id: i['auto id'],
        email: i.bb_email_od,
        next_date_renew: i.next_date_renew,
        link: i.link,
      })),
    });
  } catch (err: any) {
    console.error('POST /api/admin/force-renew error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
