import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET || 'sellin-cron-secret-2026';
const BACKEND_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3300';

function matchesCron(cronExpr: string, date: Date = new Date()): boolean {
  try {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length < 5) return false;
    const [min, hour, dom, mon, dow] = parts;

    const currMin = date.getUTCMinutes();
    const currHour = date.getUTCHours();
    const currDom = date.getUTCDate();
    const currMon = date.getUTCMonth() + 1;
    const currDow = date.getUTCDay();

    const matchPart = (part: string, val: number) => {
      if (part === '*') return true;
      if (part.includes('/')) {
        const step = parseInt(part.split('/')[1], 10);
        return val % step === 0;
      }
      if (part.includes(',')) {
        return part.split(',').map(Number).includes(val);
      }
      return parseInt(part, 10) === val;
    };

    return (
      matchPart(min, currMin) &&
      matchPart(hour, currHour) &&
      matchPart(dom, currDom) &&
      matchPart(mon, currMon) &&
      matchPart(dow, currDow)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    const isAuthorized =
      authHeader === `Bearer ${process.env.CRON_SECRET}` ||
      authHeader === `Bearer ${CRON_SECRET}` ||
      key === CRON_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron worker' }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Načteme všechny aktivní cron úlohy
    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'cron');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const now = new Date();
    const executed: string[] = [];

    for (const job of jobs || []) {
      const shouldRun = matchesCron(job.schedule_cron, now);

      if (shouldRun) {
        // Zkontrolujeme, aby se nespustil vícekrát ve stejné minutě
        if (job.last_run_at) {
          const lastRun = new Date(job.last_run_at);
          const diffMinutes = (now.getTime() - lastRun.getTime()) / (1000 * 60);
          if (diffMinutes < 1) continue;
        }

        executed.push(job.name);

        // Zde spustíme příslušnou akci obdobně jako v run route
        // Pro přehlednost zapíšeme do logu
        await supabase.from('cron_job_logs').insert({
          job_id: job.id,
          job_name: job.name,
          action_type: job.action_type,
          triggered_by: 'cron',
          status: 'running',
          started_at: now.toISOString(),
          message: 'Automaticky spuštěno časovačem (Cron worker)',
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      checkedCount: (jobs || []).length,
      executed,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
