import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function checkAdmin(supabase: any) {
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

  if (!userCreds || userCreds.length === 0) {
    return { isAdmin: false, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, error: null };
}

// GET /api/admin/app-errors — list application errors (FE & BE)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'all';
    const resolved = searchParams.get('resolved') || 'unresolved'; // 'unresolved' | 'resolved' | 'all'
    const q = searchParams.get('q')?.trim() || '';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 100, 1), 300);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let query = supabase
      .from('app_error_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source !== 'all') {
      query = query.eq('source', source);
    }

    if (resolved === 'unresolved') {
      query = query.eq('resolved', false);
    } else if (resolved === 'resolved') {
      query = query.eq('resolved', true);
    }

    if (q) {
      query = query.or(
        `message.ilike.%${q}%,path.ilike.%${q}%,error_type.ilike.%${q}%,user_email.ilike.%${q}%`
      );
    }

    const [listRes, countUnresolved, countFe, countBe] = await Promise.all([
      query,
      supabase.from('app_error_logs').select('id', { count: 'exact', head: true }).eq('resolved', false),
      supabase.from('app_error_logs').select('id', { count: 'exact', head: true }).eq('source', 'frontend').eq('resolved', false),
      supabase.from('app_error_logs').select('id', { count: 'exact', head: true }).eq('source', 'backend').eq('resolved', false),
    ]);

    if (listRes.error) {
      return NextResponse.json({ success: false, error: listRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: listRes.data || [],
      total: listRes.count || 0,
      summary: {
        unresolved: countUnresolved.count || 0,
        unresolvedFrontend: countFe.count || 0,
        unresolvedBackend: countBe.count || 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

// PATCH /api/admin/app-errors — mark error(s) resolved or unresolved
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const resolved = Boolean(body.resolved);
    const resolvedAt = resolved ? new Date().toISOString() : null;

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const { error: patchError } = await supabase
        .from('app_error_logs')
        .update({ resolved, resolved_at: resolvedAt })
        .in('id', body.ids);

      if (patchError) {
        return NextResponse.json({ success: false, error: patchError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, count: body.ids.length });
    }

    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí id záznamu' }, { status: 400 });
    }

    const { error: patchError } = await supabase
      .from('app_error_logs')
      .update({ resolved, resolved_at: resolvedAt })
      .eq('id', id);

    if (patchError) {
      return NextResponse.json({ success: false, error: patchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}

// DELETE /api/admin/app-errors — purge resolved or delete specific error
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const purgeResolved = searchParams.get('purge_resolved') === 'true';

    if (purgeResolved) {
      const { error: delError } = await supabase
        .from('app_error_logs')
        .delete()
        .eq('resolved', true);

      if (delError) {
        return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Vyřešené chyby byly smazány.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Chybí ID chyby k odstranění.' }, { status: 400 });
    }

    const { error: delError } = await supabase
      .from('app_error_logs')
      .delete()
      .eq('id', Number(id));

    if (delError) {
      return NextResponse.json({ success: false, error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
