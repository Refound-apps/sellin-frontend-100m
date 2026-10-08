import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScraperActionUrl } from '@/lib/backend';

export const dynamic = 'force-dynamic';

const EXCLUDED_CONDITIONS = [
  'error_delete',
  'ok_deleted',
  'error_create',
  'error_create_blocked',
  'ok_blocked',
  'app_archive',
  'app_delete',
] as const;

const ARCHIVED_OFFER_STATES = new Set(['app_archive', 'app_delete', 'ok_deleted']);

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

/** Keep only the newest detail row per offer (same as cron DISTINCT ON). */
async function filterToLatestDetailsPerOffer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  items: any[],
  marketplace: Marketplace
) {
  if (items.length === 0) return items;

  const offerIds = [
    ...new Set(items.map((d) => d.bb_offer_id).filter(Boolean).map(String)),
  ];
  if (offerIds.length === 0) return items;

  // select('*') — column "auto id" breaks Supabase's typed select parser
  const { data: peers, error } = await supabase
    .from('offer_detail_pg')
    .select('*')
    .eq('bb_marketplace_id', marketplace)
    .in('bb_offer_id', offerIds);

  if (error) {
    throw new Error(`Chyba kontroly latest offer_detail: ${error.message}`);
  }

  // Prefer live portal rows over deleted generations (same rule as cron renew).
  const isGone = (condition: unknown) => {
    const c = String(condition || '').toLowerCase();
    return (
      c === 'ok_deleted' ||
      c === 'error_delete' ||
      c === 'app_archive' ||
      c === 'app_delete' ||
      c === 'error_create' ||
      c === 'error_create_blocked' ||
      c === 'ok_blocked'
    );
  };

  type Ranked = { id: number; gone: boolean };
  const bestByOffer = new Map<string, Ranked>();
  for (const row of peers || []) {
    const offerId = String(row.bb_offer_id || '');
    const id = Number(row['auto id']);
    if (!offerId || !Number.isFinite(id)) continue;
    const gone = isGone(row.condition);
    const prev = bestByOffer.get(offerId);
    if (!prev) {
      bestByOffer.set(offerId, { id, gone });
      continue;
    }
    // Live beats deleted; then higher auto id wins.
    if (prev.gone && !gone) {
      bestByOffer.set(offerId, { id, gone });
    } else if (prev.gone === gone && id > prev.id) {
      bestByOffer.set(offerId, { id, gone });
    }
  }

  return items.filter((d) => {
    const offerId = String(d.bb_offer_id || '');
    const id = Number(d['auto id']);
    const best = bestByOffer.get(offerId);
    return offerId && Number.isFinite(id) && best?.id === id;
  });
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
  // Over-fetch: stale superseded ok_created rows sort early by next_date_renew and would
  // fill the page before latest-only filtering. Cron uses DISTINCT ON; we approximate.
  const pageSize = Math.min(Math.max(max * 8, max + 50), 2000);
  const collected: any[] = [];
  let cursor = offset;
  let guard = 0;

  while (collected.length < max && guard < 6) {
    guard += 1;

    let query = supabase
      .from('offer_detail_pg')
      .select('*')
      .eq('bb_marketplace_id', marketplace)
      .not('condition', 'in', `(${EXCLUDED_CONDITIONS.join(',')})`)
      .or('platform_blocked.is.null,platform_blocked.eq.false')
      .or('skip_renew.is.null,skip_renew.eq.false')
      .order('next_date_renew', { ascending: true, nullsFirst: true })
      .range(cursor, cursor + pageSize - 1);

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

    const batch = details || [];
    if (batch.length === 0) break;

    const latestOnly = await filterToLatestDetailsPerOffer(supabase, batch, marketplace);
    for (const row of latestOnly) {
      collected.push(row);
      if (collected.length >= max) break;
    }

    cursor += batch.length;
    if (batch.length < pageSize) break;
  }

  return collected.slice(0, max);
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
      ? supabase
          .from('offer_pg')
          .select('bb_id, autotop, autorenew_freq, autorenewal, state')
          .in('bb_id', offerIds)
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

  // Flatten join fields like original Budibase SELECT * JOIN.
  // Skip archived/deleted offers — force renew must never revive them.
  const enriched = items
    .map((detail) => {
      const offer = offerById.get(detail.bb_offer_id || '');
      if (!offer || ARCHIVED_OFFER_STATES.has(String(offer.state || ''))) {
        return null;
      }
      const link = String(detail.link || '');
      if (link && !link.startsWith('http')) {
        return null;
      }
      const cred = credByEmail.get((detail.bb_email_od || '').toLowerCase().trim());
      return {
        ...detail,
        state: offer?.state ?? null,
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
    })
    .filter(Boolean) as any[];

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

  // Count is approximate (detail-level); archived offer_pg rows are filtered in loadForceRenewCandidates.
  let query = supabase
    .from('offer_detail_pg')
    .select('bb_offer_id', { count: 'exact', head: true })
    .eq('bb_marketplace_id', marketplace)
    .not('condition', 'in', `(${EXCLUDED_CONDITIONS.join(',')})`)
    .or('platform_blocked.is.null,platform_blocked.eq.false')
    .or('skip_renew.is.null,skip_renew.eq.false')
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
    const backendUrl = getScraperActionUrl(endpoint);
    const payload = {
      offerdetails: items,
      vouchers: JSON.stringify(voucherPayload),
      creds,
    };

    console.log(`[force-renew] POST ${backendUrl} count=${items.length} email=${emails.join(',')}`);

    const payloadJson = JSON.stringify(payload);
    const backendPromise = fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payloadJson,
    });

    // Produkční backend často neodpoví hned (starší build bez 202) — renew přitom už běží.
    // Nečekáme donekonečna, ať UI nepřestane na „Spouštím…“.
    type RaceResult =
      | { kind: 'response'; res: Response }
      | { kind: 'error'; error: any }
      | { kind: 'timeout' };

    const raced: RaceResult = await Promise.race([
      backendPromise.then(
        (res) => ({ kind: 'response' as const, res }),
        (error) => ({ kind: 'error' as const, error })
      ),
      new Promise<RaceResult>((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout' }), 6000)
      ),
    ]);

    if (raced.kind === 'error') {
      console.error('[force-renew] Backend unreachable:', raced.error);
      return NextResponse.json(
        {
          success: false,
          error: `Backend nedostupný na ${backendUrl}. Zkontroluj SCRAPER_API_URL / API_URL. (${raced.error?.message || 'connection failed'})`,
          endpoint,
          backendUrl,
        },
        { status: 502 }
      );
    }

    if (raced.kind === 'timeout') {
      // Necháme backendPromise běžet na pozadí (pokud runtime dovolí)
      backendPromise.catch((err) => console.error('[force-renew] late backend error:', err));
      return NextResponse.json({
        success: true,
        started: true,
        pending: true,
        message: `Force renew odeslán na backend (${items.length} inzerátů). Backend ještě neodpověděl — obnova pravděpodobně běží na pozadí.`,
        count: items.length,
        vouchersCount: voucherPayload.length,
        emails,
        marketplace,
        endpoint,
        backendUrl,
      });
    }

    const backendRes = raced.res;
    let backendBody: any = null;
    try {
      backendBody = await backendRes.json();
    } catch {
      backendBody = null;
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Backend ${backendUrl} vrátil ${backendRes.status}`,
          endpoint,
          backendUrl,
          backendBody,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      started: true,
      message: `Force renew přijat backendem (${items.length} inzerátů, ${voucherPayload.length} voucherů) → ${backendUrl}`,
      count: items.length,
      vouchersCount: voucherPayload.length,
      emails,
      marketplace,
      endpoint,
      backendUrl,
      backendStatus: backendRes.status,
      backendBody,
      sample: items.slice(0, 5).map((i) => ({
        auto_id: i['auto id'],
        email: i.bb_email_od,
        next_date_renew: i.next_date_renew,
        link: i.link,
        condition: i.condition,
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
