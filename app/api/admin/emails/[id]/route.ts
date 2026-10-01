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

// GET /api/admin/emails/[id]
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { isAdmin, error: authError } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: authError }, { status: 403 });
    }

    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chybí RESEND_API_KEY v .env.local' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ success: false, error: 'Chybí ID e-mailu.' }, { status: 400 });
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.get(id.trim());

    if (error) {
      console.error('Resend emails.get failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Načtení detailu e-mailu selhalo.', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('GET /api/admin/emails/[id] error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
