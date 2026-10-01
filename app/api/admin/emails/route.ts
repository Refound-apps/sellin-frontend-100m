import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
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

  const isAdmin = Boolean(userCreds && userCreds.length > 0);
  if (!isAdmin) {
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, error: null };
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// GET /api/admin/emails?limit=&after=&before=
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error: authError } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: authError }, { status: 403 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'Chybí RESEND_API_KEY v .env.local' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit') || 50);
    const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) ? rawLimit : 50));
    const after = searchParams.get('after') || undefined;
    const before = searchParams.get('before') || undefined;

    if (after && before) {
      return NextResponse.json(
        { success: false, error: 'Nelze použít after a before zároveň.' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.list(
      after
        ? { limit, after }
        : before
          ? { limit, before }
          : { limit }
    );

    if (error) {
      console.error('Resend emails.list failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Načtení e-mailů selhalo.', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      object: data?.object ?? 'list',
      has_more: Boolean(data?.has_more),
      data: data?.data ?? [],
    });
  } catch (err: any) {
    console.error('GET /api/admin/emails error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
