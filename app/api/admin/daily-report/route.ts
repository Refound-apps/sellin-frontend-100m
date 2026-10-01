import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import {
  buildDailyUserReportFromRows,
  createDailyUserReportHtml,
  createDailyUserReportSubject,
} from '@/lib/dailyUserReport';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, error: 'Neautorizováno', user: null };
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
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora', user: null };
  }

  return { isAdmin: true, error: null, user };
}

async function loadDailyReport(supabase: Awaited<ReturnType<typeof createClient>>, sellerEmailRaw: string) {
  const sellerEmail = sellerEmailRaw.toLowerCase().trim();
  if (!sellerEmail || !sellerEmail.includes('@')) {
    throw new Error('Zadej platný e-mail prodejce.');
  }

  const { data: credentials, error: credErr } = await supabase
    .from('credential_pg')
    .select('email, telephone1, bazos_name, status_cz, bazos_bkod, sbazar_email')
    .or(`email.ilike.${sellerEmail},sbazar_email.ilike.${sellerEmail}`);

  if (credErr) throw new Error(credErr.message);
  if (!credentials || credentials.length === 0) {
    throw new Error(`Pro ${sellerEmail} nebyly nalezeny žádné spárované účty.`);
  }

  const sbazarEmails = [
    ...new Set(
      credentials
        .map((c) => (c.sbazar_email || '').toLowerCase().trim())
        .filter(Boolean)
    ),
  ];

  let allCreds = credentials;
  if (sbazarEmails.length > 0) {
    const orFilter = sbazarEmails
      .flatMap((e) => [`sbazar_email.ilike.${e}`, `email.ilike.${e}`])
      .join(',');
    const { data: paired, error: pairedErr } = await supabase
      .from('credential_pg')
      .select('email, telephone1, bazos_name, status_cz, bazos_bkod, sbazar_email')
      .or(orFilter);
    if (pairedErr) throw new Error(pairedErr.message);
    if (paired?.length) {
      const byEmail = new Map<string, (typeof paired)[number]>();
      for (const row of [...credentials, ...paired]) {
        byEmail.set(row.email.toLowerCase(), row);
      }
      allCreds = Array.from(byEmail.values());
    }
  }

  const emails = allCreds.map((c) => c.email);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const details: Array<{
    bb_marketplace_id: string | null;
    condition: string | null;
    last_date_renewed: string | null;
    date: string | null;
  }> = [];

  const chunkSize = 20;
  const pageSize = 1000;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('offer_detail_pg')
        .select('bb_marketplace_id, condition, last_date_renewed, date')
        .in('bb_email_od', chunk)
        .gte('last_date_renewed', sinceIso)
        .in('condition', ['ok_created', 'ok_renewed', 'ok_updated', 'ok_topped'])
        .order('last_date_renewed', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw new Error(error.message);
      if (!data?.length) break;
      details.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
      if (from >= 20_000) break;
    }
  }

  const report = buildDailyUserReportFromRows({
    sellerEmail,
    credentials: allCreds,
    details,
    since,
  });

  return {
    report,
    html: createDailyUserReportHtml(report),
    subject: createDailyUserReportSubject(report),
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error: authError } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: authError }, { status: 403 });
    }

    const seller =
      request.nextUrl.searchParams.get('seller') ||
      request.nextUrl.searchParams.get('email') ||
      'duplux@seznam.cz';

    const payload = await loadDailyReport(supabase, seller);
    return NextResponse.json({
      success: true,
      report: payload.report,
      subject: payload.subject,
      html: payload.html,
    });
  } catch (err: any) {
    console.error('GET /api/admin/daily-report error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await checkAdmin(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const seller = String(body?.seller || body?.email || 'duplux@seznam.cz').trim();
    const to = String(body?.to || body?.recipient || auth.user?.email || 'obchod@sellin.cz').trim();

    if (!to || !to.includes('@')) {
      return NextResponse.json({ success: false, error: 'Zadej platný e-mail příjemce.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chybí RESEND_API_KEY v .env.local' },
        { status: 500 }
      );
    }

    const payload = await loadDailyReport(supabase, seller);
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Prodejomat <robot@prodejomat.cz>',
      to: [to],
      replyTo: 'obchod@sellin.cz',
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      console.error('Daily report email failed:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Odeslání reportu selhalo.', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data?.id || null,
      to,
      subject: payload.subject,
      report: payload.report,
    });
  } catch (err: any) {
    console.error('POST /api/admin/daily-report error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Neočekávaná chyba' },
      { status: 500 }
    );
  }
}
