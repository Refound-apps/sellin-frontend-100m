import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: any) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, user: null, error: 'Neautorizováno' };
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
    return { isAdmin: false, user, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, user, error: null };
}

// GET /api/admin/cron-jobs - List all cron jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { data, error: dbError } = await supabase
      .from('cron_jobs')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (dbError) {
      console.error('Error fetching cron jobs:', dbError);
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('GET cron-jobs unhandled error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/admin/cron-jobs - Create new cron job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      is_active = true,
      trigger_type = 'cron',
      schedule_cron = '0 21 * * *',
      schedule_preset = 'daily_21',
      schedule_human = 'Každý den ve 21:00',
      action_type = 'renew_sbazar',
      target_emails = [],
      max_items = 40,
      settings = {},
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Název úlohy je povinný' }, { status: 400 });
    }

    const { data, error: insertError } = await supabase
      .from('cron_jobs')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        is_active,
        trigger_type,
        schedule_cron,
        schedule_preset,
        schedule_human,
        action_type,
        target_emails: Array.isArray(target_emails) ? target_emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean) : [],
        max_items: Number(max_items) || 40,
        settings: settings || {},
        last_run_status: 'idle',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating cron job:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('POST cron-jobs unhandled error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT /api/admin/cron-jobs - Update an existing cron job
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID úlohy' }, { status: 400 });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
    if (updates.trigger_type !== undefined) payload.trigger_type = updates.trigger_type;
    if (updates.schedule_cron !== undefined) payload.schedule_cron = updates.schedule_cron;
    if (updates.schedule_preset !== undefined) payload.schedule_preset = updates.schedule_preset;
    if (updates.schedule_human !== undefined) payload.schedule_human = updates.schedule_human;
    if (updates.action_type !== undefined) payload.action_type = updates.action_type;
    if (updates.target_emails !== undefined) {
      payload.target_emails = Array.isArray(updates.target_emails)
        ? updates.target_emails.map((e: string) => e.trim().toLowerCase()).filter(Boolean)
        : [];
    }
    if (updates.max_items !== undefined) payload.max_items = Number(updates.max_items) || 40;
    if (updates.settings !== undefined) payload.settings = updates.settings;

    const { data, error: updateError } = await (supabase.from('cron_jobs') as any)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating cron job:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('PUT cron-jobs unhandled error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/cron-jobs?id=... - Delete a cron job
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID úlohy' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('cron_jobs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting cron job:', deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE cron-jobs unhandled error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
