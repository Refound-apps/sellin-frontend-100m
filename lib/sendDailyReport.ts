import type { SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  buildDailyUserReportFromRows,
  createDailyUserReportHtml,
  createDailyUserReportSubject,
  type DailyUserReport,
} from '@/lib/dailyUserReport';

export async function loadDailyReport(
  supabase: SupabaseClient,
  sellerEmailRaw: string
): Promise<{
  report: DailyUserReport;
  html: string;
  subject: string;
}> {
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

export async function sendDailyReportEmail(opts: {
  supabase: SupabaseClient;
  seller: string;
  to: string;
}): Promise<{ id: string | null; to: string; subject: string; report: DailyUserReport }> {
  const to = opts.to.trim();
  if (!to || !to.includes('@')) {
    throw new Error('Zadej platný e-mail příjemce.');
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  if (!apiKey) {
    throw new Error('Chybí RESEND_API_KEY');
  }

  const payload = await loadDailyReport(opts.supabase, opts.seller);
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: 'Prodejomat <robot@prodejomat.cz>',
    to: [to],
    replyTo: 'obchod@sellin.cz',
    subject: payload.subject,
    html: payload.html,
  });

  if (error) {
    throw new Error(error.message || 'Odeslání reportu selhalo.');
  }

  return {
    id: data?.id || null,
    to,
    subject: payload.subject,
    report: payload.report,
  };
}
