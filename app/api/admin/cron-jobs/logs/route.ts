import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    let query = supabase
      .from('cron_job_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error: logsError } = await query;
    if (logsError) {
      return NextResponse.json({ success: false, error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
