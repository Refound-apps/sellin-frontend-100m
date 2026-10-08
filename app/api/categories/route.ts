import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

/** GET /api/categories — logged-in sellers (create form). */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const backendRes = await backendFetch('/api/categories');
    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error('GET /api/categories error:', err);
    return NextResponse.json(
      { success: false, error: 'Nepodařilo se načíst kategorie.' },
      { status: 500 }
    );
  }
}
