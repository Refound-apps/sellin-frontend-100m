import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = String(body.message || '').trim();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Chybí zpráva chyby' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = (body.userEmail || user?.email || null)?.toLowerCase().trim();
    const source = String(body.source || 'frontend').slice(0, 50);
    const errorType = body.errorType ? String(body.errorType).slice(0, 100) : null;
    const statusCode = typeof body.statusCode === 'number' ? body.statusCode : null;
    const path = body.path ? String(body.path).slice(0, 500) : null;

    // Sanitize metadata
    let metadata = body.metadata || {};
    if (typeof metadata !== 'object') {
      metadata = { raw: String(metadata) };
    }

    const { error: insertError } = await supabase.from('app_error_logs').insert({
      source,
      message: message.slice(0, 5000),
      error_type: errorType,
      status_code: statusCode,
      path,
      user_email: userEmail,
      metadata,
    });

    if (insertError) {
      console.error('[log-error] DB insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[log-error] Unexpected route error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
