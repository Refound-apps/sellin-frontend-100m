import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

function createWriter() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) {
    return createServiceClient<Database>(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return null;
}

const BOT_USER_AGENTS = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'mediapartners',
  'headlesschrome',
  'lighthouse',
  'ptst',
];

/** Public Prodejomat.cz ping — increments today's visit counter for the main website. */
export async function POST(request: NextRequest) {
  try {
    const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
    // Do not count automated crawler/bot pings as human visitor sessions
    if (BOT_USER_AGENTS.some((bot) => userAgent.includes(bot))) {
      return NextResponse.json({ success: true, ignored: 'bot' });
    }

    const writer = createWriter() ?? (await createClient());
    const { error } = await writer.rpc('increment_prodejomat_visit');

    if (error) {
      console.error('POST /api/prodejomat/visit error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('POST /api/prodejomat/visit error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
