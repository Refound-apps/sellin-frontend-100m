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

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const to = String(body?.to || body?.recipient || '').trim();
    const subject = String(body?.subject || 'Sellin – test Resend').trim();
    const message = String(
      body?.message || body?.text || 'Testovací e-mail ze Sellin. Pokud tohle vidíš, Resend funguje.'
    ).trim();

    if (!to || !to.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Zadej platný e-mail příjemce.' },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Sellin <sellin@sellin.cz>',
      to: [to],
      subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
    });

    if (error) {
      console.error('Resend test email failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Odeslání e-mailu selhalo.', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id || null });
  } catch (err: any) {
    console.error('POST /api/admin/test-email error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
