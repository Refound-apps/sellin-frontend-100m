import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { constrainEmailsToAllowed, resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

function parseEmailList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);
}

/**
 * GET /api/offers
 * - Seller: always scoped to own accounts + sbazar-linked subaccounts
 * - Admin: all offers (optional emails / exact_bb_email filter)
 */
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

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);
    const { searchParams } = new URL(request.url);

    const requestedEmails = parseEmailList(
      searchParams.get('emails') || searchParams.get('email')
    );
    const exactRaw =
      searchParams.get('exact_bb_email') ||
      (searchParams.get('exact') === 'true' || searchParams.get('exact') === '1'
        ? searchParams.get('emails')
        : null);
    const requestedExact = parseEmailList(exactRaw);

    const backendParams = new URLSearchParams();

    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    backendParams.set('limit', String(limit));
    backendParams.set('offset', String(offset));

    const search = searchParams.get('search');
    if (search?.trim()) {
      backendParams.set('search', search.trim());
    }

    if (isAdmin) {
      // Admin: optional filter; no emails = platform-wide list (admin UI)
      if (requestedExact.length > 0) {
        backendParams.set('exact_bb_email', requestedExact.join(','));
        backendParams.set('exact', '1');
        backendParams.set('emails', requestedExact.join(','));
      } else if (requestedEmails.length > 0) {
        backendParams.set('emails', requestedEmails.join(','));
      }
    } else {
      // Seller: never unscoped
      if (allowedEmails.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          limit,
          offset,
        });
      }

      if (requestedExact.length > 0) {
        const exact = constrainEmailsToAllowed(requestedExact, allowedEmails);
        if (exact.length === 0) {
          return NextResponse.json({
            success: true,
            data: [],
            total: 0,
            limit,
            offset,
          });
        }
        backendParams.set('exact_bb_email', exact.join(','));
        backendParams.set('exact', '1');
        backendParams.set('emails', exact.join(','));
      } else {
        const scoped = constrainEmailsToAllowed(requestedEmails, allowedEmails);
        backendParams.set('emails', scoped.join(','));
      }
    }

    const backendRes = await backendFetch(`/api/offers?${backendParams.toString()}`);

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: 'Chyba při komunikaci s backend serverem.' },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('Error proxying offers API:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}
