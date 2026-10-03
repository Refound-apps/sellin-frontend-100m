import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const TEMPLATE_NAME = 'default';

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null, error: 'Neautorizováno' as const };
  }
  return { supabase, user, error: null as null };
}

/** GET — načte výchozí šablonu přihlášeného uživatele */
export async function GET() {
  try {
    const { supabase, user, error: authError } = await requireUser();
    if (!user) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('offer_templates')
      .select('id, name, payload, updated_at')
      .eq('user_id', user.id)
      .eq('name', TEMPLATE_NAME)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Chyba při načítání šablony' },
      { status: 500 }
    );
  }
}

/** PUT — uloží / přepíše výchozí šablonu (celý formulář) */
export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireUser();
    if (!user) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const payload = body?.payload;
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Chybí payload šablony' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('offer_templates')
      .upsert(
        {
          user_id: user.id,
          name: TEMPLATE_NAME,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,name' }
      )
      .select('id, name, payload, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, template: data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Chyba při ukládání šablony' },
      { status: 500 }
    );
  }
}
