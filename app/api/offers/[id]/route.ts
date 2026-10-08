import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

function offerOwnerEmail(offer: { bb_email?: string | null } | null | undefined): string | null {
  const email = offer?.bb_email?.toLowerCase().trim();
  return email || null;
}

async function authorizeOfferAccess(offerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false as const, status: 401, error: 'Neautorizováno' };
  }

  const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);

  const backendRes = await backendFetch(`/api/offers/${offerId}`);
  const payload = await backendRes.json().catch(() => null);

  if (!backendRes.ok) {
    return {
      ok: false as const,
      status: backendRes.status,
      error: payload?.error || 'Nabídka nenalezena',
      payload,
    };
  }

  const offer = payload?.data ?? payload;
  const owner = offerOwnerEmail(offer);

  if (!isAdmin) {
    if (!owner || !allowedEmails.includes(owner)) {
      return { ok: false as const, status: 403, error: 'Nemáte přístup k této nabídce' };
    }
  }

  return {
    ok: true as const,
    isAdmin,
    allowedEmails,
    offer,
    payload,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await authorizeOfferAccess(id);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }
    return NextResponse.json(access.payload);
  } catch (err: unknown) {
    console.error('Error proxying offer GET:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await authorizeOfferAccess(id);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const body = await request.json();

    // Seller must not reassign offer to another account
    if (!access.isAdmin && body?.bb_email) {
      const nextOwner = String(body.bb_email).toLowerCase().trim();
      if (nextOwner && !access.allowedEmails.includes(nextOwner)) {
        return NextResponse.json(
          { success: false, error: 'Nemůžete přesunout nabídku na cizí účet' },
          { status: 403 }
        );
      }
    }

    const backendRes = await backendFetch(`/api/offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('Error proxying offer PUT:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await authorizeOfferAccess(id);
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const backendRes = await backendFetch(`/api/offers/${id}`, {
      method: 'DELETE',
    });

    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('Error proxying offer DELETE:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se připojit k backend serveru.' },
      { status: 500 }
    );
  }
}
