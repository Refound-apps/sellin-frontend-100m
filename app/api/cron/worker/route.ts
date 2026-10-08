import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { matchesCron, wasRunRecently } from '@/lib/cron/schedule';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: NextRequest): boolean {
  if (!CRON_SECRET) return false;
  const authHeader = request.headers.get('authorization');
  // Bearer only — never accept ?key= (leaks via logs/Referer)
  return authHeader === `Bearer ${CRON_SECRET}`;
}

function resolveAppOrigin(request: NextRequest): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET is not configured' },
        { status: 503 }
      );
    }
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron worker' }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const now = new Date();

    const { data: jobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true)
      .eq('trigger_type', 'cron');

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const origin = resolveAppOrigin(request);
    const due: { id: string; name: string; schedule_cron: string }[] = [];
    const skipped: { id: string; name: string; reason: string }[] = [];
    const executed: { id: string; name: string; ok: boolean; message?: string }[] = [];

    for (const job of jobs || []) {
      if (!matchesCron(job.schedule_cron, now)) {
        skipped.push({ id: job.id, name: job.name, reason: 'schedule_mismatch' });
        continue;
      }

      if (wasRunRecently(job.last_run_at, now)) {
        skipped.push({ id: job.id, name: job.name, reason: 'cooldown' });
        continue;
      }

      due.push({ id: job.id, name: job.name, schedule_cron: job.schedule_cron });

      try {
        const runRes = await fetch(`${origin}/api/admin/cron-jobs/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${CRON_SECRET}`,
          },
          body: JSON.stringify({ id: job.id, triggered_by: 'cron' }),
        });

        const payload = await runRes.json().catch(() => ({}));
        executed.push({
          id: job.id,
          name: job.name,
          ok: runRes.ok && payload?.success !== false,
          message: payload?.message || payload?.error || `HTTP ${runRes.status}`,
        });
      } catch (err: any) {
        executed.push({
          id: job.id,
          name: job.name,
          ok: false,
          message: err?.message || 'fetch failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      origin,
      checkedCount: (jobs || []).length,
      dueCount: due.length,
      due,
      executed,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** Vercel Cron may POST; treat same as GET. */
export async function POST(request: NextRequest) {
  return GET(request);
}
