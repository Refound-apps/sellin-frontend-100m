import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScraperActionUrl } from '@/lib/backend';

export const dynamic = 'force-dynamic';

type Marketplace = 'Bazoš' | 'Bazoš.sk' | 'Sbazar';

function parseMarketplace(value: unknown): Marketplace {
  if (value === 'Bazoš.sk') return 'Bazoš.sk';
  if (value === 'Sbazar') return 'Sbazar';
  return 'Bazoš';
}

function recreateEndpoint(marketplace: Marketplace): string {
  if (marketplace === 'Bazoš.sk') return '/recreatebazossk';
  if (marketplace === 'Sbazar') return '/recreatesbazar';
  return '/recreatebazos';
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
    return {
      isAdmin: false as const,
      error: 'Přístup odepřen: vyžaduje roli administrátora',
      status: 403,
    };
  }

  return { isAdmin: true as const, error: null, status: 200 };
}

/**
 * Stejná logika jako Budibase RECREATE BAZOS:
 * SELECT * FROM offer_pg
 * WHERE bb_email = email AND state != 'app_archive'
 * ORDER BY created_at ASC
 * LIMIT max OFFSET offset
 */
async function loadRecreateOffers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: { email: string; max: number; offset: number }
) {
  const { email, max, offset } = opts;
  const to = offset + Math.max(max, 1) - 1;

  const { data, error } = await supabase
    .from('offer_pg')
    .select(
      '"auto id", bb_id, bb_email, title, price, state, created_at, preview_image, zipcode, location'
    )
    .ilike('bb_email', email.trim())
    .neq('state', 'app_archive')
    .order('created_at', { ascending: true, nullsFirst: false })
    .range(offset, to);

  if (error) {
    throw new Error(`Chyba načítání offer_pg: ${error.message}`);
  }

  return data || [];
}

async function loadCredentials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string
) {
  const { data, error } = await supabase
    .from('credential_pg')
    .select('*')
    .ilike('email', email.trim());

  if (error) {
    throw new Error(`Chyba načítání credential_pg: ${error.message}`);
  }

  return data || [];
}

async function countRecreateOffers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string
) {
  const { count, error } = await supabase
    .from('offer_pg')
    .select('bb_id', { count: 'exact', head: true })
    .ilike('bb_email', email.trim())
    .neq('state', 'app_archive');

  if (error) {
    throw new Error(`Chyba count offer_pg: ${error.message}`);
  }

  return count || 0;
}

/** Náhled kandidátů k recreate. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const email = String(searchParams.get('email') || '').trim();
    const max = Math.min(Math.max(Number(searchParams.get('max') || 20) || 20, 1), 500);
    const offset = Math.max(Number(searchParams.get('offset') || 0) || 0, 0);
    const marketplace = parseMarketplace(searchParams.get('marketplace'));

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: true,
        email: '',
        max,
        offset,
        marketplace,
        total: 0,
        count: 0,
        items: [],
      });
    }

    const [items, total] = await Promise.all([
      loadRecreateOffers(supabase, { email, max, offset }),
      countRecreateOffers(supabase, email),
    ]);

    return NextResponse.json({
      success: true,
      email,
      max,
      offset,
      marketplace,
      total,
      count: items.length,
      items: items.map((o) => ({
        auto_id: o['auto id'],
        bb_id: o.bb_id,
        bb_email: o.bb_email,
        title: o.title,
        price: o.price,
        state: o.state,
        created_at: o.created_at,
        preview_image: o.preview_image,
        zipcode: o.zipcode,
        location: o.location,
      })),
    });
  } catch (err: any) {
    console.error('GET /api/admin/recreate error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}

/**
 * Spustí recreate — Budibase flow:
 * 1) RECREATE BAZOS query (offer_pg + email/max/offset)
 * 2) credentials
 * 3) POST /recreatebazos (nebo sk/sbazar)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const email = String(body?.email || '').trim();
    const max = Math.min(Math.max(Number(body?.max ?? 20) || 20, 1), 200);
    const offset = Math.max(Number(body?.offset ?? 0) || 0, 0);
    const marketplace = parseMarketplace(body?.marketplace);

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Zadej platný e-mail účtu.' },
        { status: 400 }
      );
    }

    const [offers, creds] = await Promise.all([
      loadRecreateOffers(supabase, { email, max, offset }),
      loadCredentials(supabase, email),
    ]);

    if (offers.length === 0) {
      return NextResponse.json({
        success: true,
        started: false,
        message: `Nenalezeny žádné nabídky k recreate pro ${email} (offset=${offset}, max=${max}).`,
        count: 0,
      });
    }

    if (!creds.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Nenalezeny credentials pro ${email}. Recreate nelze spustit.`,
        },
        { status: 400 }
      );
    }

    const endpoint = recreateEndpoint(marketplace);
    const backendUrl = getScraperActionUrl(endpoint);
    // Offers už jsou oříznuté LIMIT/OFFSET → backend offset=0, max=počet
    const payload = {
      offers,
      creds,
      max: offers.length,
      offset: 0,
    };

    console.log(
      `[recreate] POST ${backendUrl} count=${offers.length} email=${email} offset=${offset} max=${max}`
    );

    const backendPromise = fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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
      console.error('[recreate] Backend unreachable:', raced.error);
      return NextResponse.json(
        {
          success: false,
          error: `Backend nedostupný na ${backendUrl}. (${raced.error?.message || 'connection failed'})`,
          endpoint,
          backendUrl,
        },
        { status: 502 }
      );
    }

    if (raced.kind === 'timeout') {
      backendPromise.catch((err) => console.error('[recreate] late backend error:', err));
      return NextResponse.json({
        success: true,
        started: true,
        pending: true,
        message: `Recreate odeslán (${offers.length} nabídek, offset ${offset}). Backend ještě neodpověděl — joby pravděpodobně běží ve frontě.`,
        count: offers.length,
        email,
        marketplace,
        offset,
        max,
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

    if (!backendRes.ok || backendBody?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error:
            backendBody?.error ||
            `Backend vrátil HTTP ${backendRes.status}`,
          backendBody,
          endpoint,
          backendUrl,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      started: true,
      message:
        backendBody?.message ||
        `Recreate zařazen do fronty (${backendBody?.queued ?? offers.length} jobů).`,
      count: offers.length,
      queued: backendBody?.queued,
      skipped: backendBody?.skipped,
      email,
      marketplace,
      offset,
      max,
      endpoint,
      backendUrl,
      backendBody,
    });
  } catch (err: any) {
    console.error('POST /api/admin/recreate error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
