import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch, getBackendBaseUrl } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

/** If RLS lets the caller read the credential row, they may create for that email. */
async function canUseBbEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bbEmail: string,
  isAdmin: boolean,
  allowedEmails: string[]
): Promise<boolean> {
  if (isAdmin) return true;
  if (allowedEmails.includes(bbEmail)) return true;

  const { data, error } = await supabase
    .from('credential_pg')
    .select('id')
    .ilike('email', bbEmail)
    .limit(1);

  if (error) {
    console.error('[offers/create] credential visibility check failed:', error);
    return false;
  }
  return Boolean(data && data.length > 0);
}

function sanitizeCreateResponse(data: any) {
  if (!data || typeof data !== 'object') return data;
  const clone = { ...data };
  if (clone.data && typeof clone.data === 'object') {
    const offer = { ...clone.data };
    if (Array.isArray(offer.credential)) {
      offer.credential = offer.credential.map((c: any) => ({
        id: c?.id,
        email: c?.email,
        role: c?.role,
        location: c?.location,
        zipcode: c?.zipcode,
        bazos_name: c?.bazos_name,
        telephone1: c?.telephone1,
      }));
    }
    clone.data = offer;
  }
  return clone;
}

/** POST /api/offers/create — seller creates offer for own / subaccount email only. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);
    const body = await request.json();
    const bbEmail = String(body?.bb_email || '')
      .toLowerCase()
      .trim();

    if (!bbEmail) {
      return NextResponse.json(
        { success: false, error: 'Chybí e-mail účtu (bb_email).' },
        { status: 400 }
      );
    }

    const allowed = await canUseBbEmail(supabase, bbEmail, isAdmin, allowedEmails);
    if (!allowed) {
      console.warn('[offers/create] forbidden bb_email', {
        bbEmail,
        user: user.email,
        allowedCount: allowedEmails.length,
        allowedSample: allowedEmails.slice(0, 5),
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Nemůžete vytvořit nabídku na cizí účet. Zvolte účet ze seznamu prodejce.',
        },
        { status: 403 }
      );
    }

    if (!process.env.INTERNAL_API_SECRET) {
      console.error('[offers/create] INTERNAL_API_SECRET missing on frontend host');
      return NextResponse.json(
        {
          success: false,
          error:
            'Chybí INTERNAL_API_SECRET na Vercel. Nastav stejnou hodnotu jako na VPS (.env) a redeploy.',
        },
        { status: 500 }
      );
    }

    const backendRes = await backendFetch('/api/offers/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const contentType = backendRes.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await backendRes.text().catch(() => '');
      console.error('[offers/create] non-JSON backend', {
        status: backendRes.status,
        base: getBackendBaseUrl(),
        body: text.slice(0, 200),
      });
      return NextResponse.json(
        {
          success: false,
          error:
            backendRes.status === 404
              ? 'Backend endpoint pro vytvoření nabídky není dostupný. Na Vercel nastav SCRAPER_API_URL=https://api.sellin.cz/prod/api'
              : 'Backend vrátil neočekávanou odpověď při vytváření nabídky.',
        },
        { status: 502 }
      );
    }

    const data = await backendRes.json().catch(() => null);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Prázdná odpověď z backendu.' },
        { status: 502 }
      );
    }

    if (
      backendRes.status === 401 &&
      String((data as { error?: string }).error || '').toLowerCase() === 'unauthorized'
    ) {
      console.error('[offers/create] backend Unauthorized', {
        base: getBackendBaseUrl(),
        hasSecret: Boolean(process.env.INTERNAL_API_SECRET),
      });
      return NextResponse.json(
        {
          success: false,
          error:
            'Backend odmítl požadavek (Unauthorized). INTERNAL_API_SECRET na Vercel musí být stejný jako na VPS.',
        },
        { status: 502 }
      );
    }

    // 202 Accepted is success (queued publish)
    return NextResponse.json(sanitizeCreateResponse(data), { status: backendRes.status });
  } catch (err: unknown) {
    console.error('POST /api/offers/create error:', err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? `Nepodařilo se vytvořit nabídku: ${err.message}`
            : 'Nepodařilo se vytvořit nabídku.',
      },
      { status: 500 }
    );
  }
}
