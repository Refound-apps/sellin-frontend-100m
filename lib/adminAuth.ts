import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false as const,
      status: 401,
      error: 'Neautorizováno',
      supabase,
      user: null,
    };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  if (!userCreds || userCreds.length === 0) {
    return {
      ok: false as const,
      status: 403,
      error: 'Přístup odepřen: vyžaduje roli administrátora',
      supabase,
      user,
    };
  }

  return { ok: true as const, status: 200, error: null, supabase, user };
}
