import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logId: string | null = null;
  let supabase: any = null;

  try {
    supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    const { data: userCreds } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
      .eq('role', 'admin')
      .limit(1);

    if (!userCreds || userCreds.length === 0) {
      return NextResponse.json({ success: false, error: 'Vyžaduje administrátora' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID úlohy' }, { status: 400 });
    }

    // Načteme konfiguraci úlohy z DB
    const { data: job, error: jobErr } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ success: false, error: 'Úloha nebyla nalezena' }, { status: 404 });
    }

    // Označíme spuštění úlohy
    await supabase
      .from('cron_jobs')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'running',
        last_run_message: 'Spouštění úlohy...',
      })
      .eq('id', id);

    // Vytvoříme záznam v logu
    const { data: logEntry } = await supabase
      .from('cron_job_logs')
      .insert({
        job_id: job.id,
        job_name: job.name,
        action_type: job.action_type,
        triggered_by: 'manual_admin',
        status: 'running',
        started_at: new Date().toISOString(),
        message: 'Úloha spuštěna administrátorem',
      })
      .select()
      .single();

    if (logEntry) {
      logId = logEntry.id;
    }

    const targetEmails: string[] = Array.isArray(job.target_emails) ? job.target_emails : [];
    const maxItems = Number(job.max_items) || 40;
    const settings = job.settings || {};

    let processedCount = 0;
    let resultMessage = '';
    let details: Record<string, any> = {};

    // 1. Akce: Obnova Sbazar
    if (job.action_type === 'renew_sbazar') {
      let query = supabase
        .from('offer_detail_pg')
        .select('*')
        .eq('bb_marketplace_id', 'Sbazar')
        .in('condition', [
          'ok_created',
          'ok_updated',
          'error_update',
          'error_delete_during_renewal',
          'ok_renewed',
        ])
        .order('last_date_renewed', { ascending: true, nullsFirst: true })
        .limit(maxItems);

      if (targetEmails.length > 0) {
        query = query.in('bb_email_od', targetEmails);
      }

      const { data: offerDetails, error: odErr } = await query;
      if (odErr) throw new Error(`Chyba při čtení inzerátů z DB: ${odErr.message}`);

      const items = offerDetails || [];
      processedCount = items.length;

      if (items.length === 0) {
        resultMessage = `Nenalezeny žádné inzeráty k obnově na Sbazaru pro zadané účty (${targetEmails.join(', ') || 'všechny'}).`;
      } else {
        const endpoint = settings.with_delay ? '/renewoffersbazarwithdelay' : '/renewoffersbazar';
        const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerdetails: items }),
        });

        const statusText = backendRes.ok ? 'Odesláno na backend' : `Backend chyba ${backendRes.status}`;
        resultMessage = `${statusText}: Obnova ${items.length} inzerátů Sbazar byla zahájena.`;
        details = { count: items.length, endpoint, targetEmails };
      }
    }
    // 2. Akce: Obnova Bazoš.cz
    else if (job.action_type === 'renew_bazos') {
      let query = supabase
        .from('offer_detail_pg')
        .select('*')
        .eq('bb_marketplace_id', 'Bazoš')
        .in('condition', [
          'ok_created',
          'ok_topped',
          'ok_updated',
          'ok_blocked',
          'error_update',
          'error_delete',
          'error_delete_during_renewal',
          'ok_renewed',
        ])
        .order('last_date_renewed', { ascending: true, nullsFirst: true })
        .limit(maxItems);

      if (targetEmails.length > 0) {
        query = query.in('bb_email_od', targetEmails);
      }

      const { data: offerDetails, error: odErr } = await query;
      if (odErr) throw new Error(`Chyba při čtení inzerátů z DB: ${odErr.message}`);

      const items = offerDetails || [];
      processedCount = items.length;

      if (items.length === 0) {
        resultMessage = `Nenalezeny žádné inzeráty k obnově na Bazoš.cz pro vybrané účty.`;
      } else {
        // Zkusíme načíst dostupné vouchery pro dané účty
        const { data: vouchers } = await supabase
          .from('voucher')
          .select('value')
          .eq('used', false)
          .eq('is_valid', true)
          .in('bb_email', targetEmails)
          .limit(items.length * 2);

        const voucherValues = (vouchers || []).map((v: any) => v.value);

        const endpoint = settings.with_delay ? '/renewofferbazoswithdelay' : '/renewofferbazosv2';
        const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerdetails: items,
            vouchers: JSON.stringify(voucherValues),
          }),
        });

        const statusText = backendRes.ok ? 'Odesláno na backend' : `Backend status ${backendRes.status}`;
        resultMessage = `${statusText}: Obnova ${items.length} inzerátů na Bazoš.cz s ${voucherValues.length} vouchery zahájena.`;
        details = { count: items.length, vouchersCount: voucherValues.length, endpoint };
      }
    }
    // 3. Akce: Obnova Bazoš.sk
    else if (job.action_type === 'renew_bazos_sk') {
      let query = supabase
        .from('offer_detail_pg')
        .select('*')
        .eq('bb_marketplace_id', 'Bazoš.sk')
        .order('last_date_renewed', { ascending: true, nullsFirst: true })
        .limit(maxItems);

      if (targetEmails.length > 0) {
        query = query.in('bb_email_od', targetEmails);
      }

      const { data: offerDetails, error: odErr } = await query;
      if (odErr) throw new Error(`Chyba při čtení z DB: ${odErr.message}`);

      const items = offerDetails || [];
      processedCount = items.length;

      if (items.length === 0) {
        resultMessage = `Nenalezeny žádné inzeráty pro Bazoš.sk.`;
      } else {
        const endpoint = settings.with_delay ? '/renewofferbazosskwithdelay' : '/renewofferbazossk';
        const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerdetails: items }),
        });

        resultMessage = `Zahájena obnova ${items.length} inzerátů na Bazoš.sk (status ${backendRes.status}).`;
        details = { count: items.length, endpoint };
      }
    }
    // 4. Akce: Pře-vytvoření (recreate)
    else if (job.action_type === 'recreate_bazos' || job.action_type === 'recreate_sbazar') {
      let query = supabase
        .from('offer_pg')
        .select('*')
        .neq('state', 'app_archive')
        .order('auto id', { ascending: false })
        .limit(maxItems);

      if (targetEmails.length > 0) {
        query = query.in('bb_email', targetEmails);
      }

      const { data: offers, error: oErr } = await query;
      if (oErr) throw new Error(`Chyba načítání: ${oErr.message}`);

      // Creds
      const { data: creds } = await supabase
        .from('credential_pg')
        .select('*')
        .in('email', targetEmails)
        .limit(1);

      const items = offers || [];
      processedCount = items.length;

      const endpoint = job.action_type === 'recreate_bazos' ? '/recreatebazos' : '/recreatesbazar';
      const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offers: items, creds: creds || [] }),
      });

      resultMessage = `Pře-vytvoření ${items.length} inzerátů odesláno na endpoint ${endpoint}.`;
      details = { count: items.length, endpoint };
    }
    // 5. Volný API request
    else {
      const endpoint = settings.endpoint || '/testsellin';
      const method = settings.method || 'POST';
      const customBody = settings.custom_body || {};

      const backendRes = await fetch(`${BACKEND_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' ? JSON.stringify(customBody) : undefined,
      });

      resultMessage = `API request na ${endpoint} (${method}) proveden se statusem ${backendRes.status}`;
      details = { endpoint, method, status: backendRes.status };
    }

    const durationMs = Date.now() - startTime;

    // Aktualizujeme stav v cron_jobs
    await supabase
      .from('cron_jobs')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'success',
        last_run_message: resultMessage,
        last_run_duration_ms: durationMs,
      })
      .eq('id', job.id);

    // Aktualizujeme log záznam
    if (logId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          duration_ms: durationMs,
          processed_count: processedCount,
          message: resultMessage,
          details,
        })
        .eq('id', logId);
    }

    return NextResponse.json({
      success: true,
      message: resultMessage,
      count: processedCount,
      durationMs,
      details,
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('Error executing cron job:', err);

    if (supabase && logId) {
      await supabase
        .from('cron_job_logs')
        .update({
          status: 'error',
          finished_at: new Date().toISOString(),
          duration_ms: durationMs,
          message: err.message,
        })
        .eq('id', logId);
    }

    return NextResponse.json(
      { success: false, error: err.message || 'Chyba při vykonávání úlohy' },
      { status: 500 }
    );
  }
}
