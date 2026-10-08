import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DEFAULT_NAME = 'default';

function templateNameForBbEmail(bbEmail?: string | null): string {
  const email = (bbEmail || '').trim().toLowerCase();
  if (!email) return DEFAULT_NAME;
  return `bb:${email}`;
}

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

/** GET — šablona pro konkrétní subúčet (?bb_email=), fallback na výchozí */
export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireUser();
    if (!user) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const bbEmail = request.nextUrl.searchParams.get('bb_email');
    const scopedName = templateNameForBbEmail(bbEmail);

    // Prefer per-subaccount template; fall back to legacy single "default"
    const names =
      scopedName === DEFAULT_NAME ? [DEFAULT_NAME] : [scopedName, DEFAULT_NAME];

    const { data, error } = await supabase
      .from('offer_templates')
      .select('id, name, payload, updated_at')
      .eq('user_id', user.id)
      .in('name', names);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const scoped = rows.find((r) => r.name === scopedName) || null;
    const fallback = rows.find((r) => r.name === DEFAULT_NAME) || null;
    const template = scoped || fallback;

    return NextResponse.json({
      success: true,
      template: template || null,
      scoped: Boolean(scoped),
      bb_email: bbEmail?.trim().toLowerCase() || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Chyba při načítání šablony' },
      { status: 500 }
    );
  }
}

/** PUT — uloží šablonu pro aktuální subúčet (bb_email v payloadu / body) */
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

    const bbEmail =
      (typeof body?.bb_email === 'string' && body.bb_email.trim()) ||
      (typeof payload?.bb_email === 'string' && payload.bb_email.trim()) ||
      '';
    const name = templateNameForBbEmail(bbEmail);

    const { data, error } = await supabase
      .from('offer_templates')
      .upsert(
        {
          user_id: user.id,
          name,
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

    return NextResponse.json({
      success: true,
      template: data,
      bb_email: bbEmail.trim().toLowerCase() || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Chyba při ukládání šablony' },
      { status: 500 }
    );
  }
}
