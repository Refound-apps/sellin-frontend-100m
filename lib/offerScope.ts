import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type CredRow = Pick<
  Database['public']['Tables']['credential_pg']['Row'],
  'role' | 'email' | 'sbazar_email' | 'bazos_email' | 'facebook_email'
>;

function norm(email: string | null | undefined): string | null {
  if (!email) return null;
  const clean = email.toLowerCase().trim();
  return clean || null;
}

function addEmail(set: Set<string>, email: string | null | undefined) {
  const clean = norm(email);
  if (clean) set.add(clean);
}

function addCredEmails(set: Set<string>, cred: CredRow) {
  addEmail(set, cred.email);
  addEmail(set, cred.sbazar_email);
  addEmail(set, cred.bazos_email);
  addEmail(set, cred.facebook_email);
}

/**
 * Resolve which offer owner emails the caller may see:
 * own credential(s) + subaccounts sharing the same sbazar_email.
 */
export async function resolveCallerOfferScope(
  supabase: SupabaseClient<Database>,
  user: User
): Promise<{ isAdmin: boolean; allowedEmails: string[] }> {
  const userEmail = norm(user.email);
  const emails = new Set<string>();
  if (userEmail) emails.add(userEmail);

  const orParts = [`user_id.eq.${user.id}`];
  if (userEmail) {
    orParts.push(`email.ilike.${userEmail}`);
    orParts.push(`sbazar_email.ilike.${userEmail}`);
  }

  const { data: directCredentials } = await supabase
    .from('credential_pg')
    .select('role, email, sbazar_email, bazos_email, facebook_email')
    .or(orParts.join(','));

  let isAdmin = false;
  const sbazarEmails = new Set<string>();

  for (const cred of (directCredentials || []) as CredRow[]) {
    if (cred.role === 'admin') isAdmin = true;
    addCredEmails(emails, cred);
    const sb = norm(cred.sbazar_email);
    if (sb) sbazarEmails.add(sb);
  }

  if (sbazarEmails.size > 0) {
    const { data: linkedCredentials } = await supabase
      .from('credential_pg')
      .select('role, email, sbazar_email, bazos_email, facebook_email')
      .in('sbazar_email', Array.from(sbazarEmails));

    for (const cred of (linkedCredentials || []) as CredRow[]) {
      if (cred.role === 'admin') isAdmin = true;
      addCredEmails(emails, cred);
    }
  }

  return {
    isAdmin,
    allowedEmails: Array.from(emails),
  };
}

/** Intersect requested emails with what the seller is allowed to see. */
export function constrainEmailsToAllowed(
  requested: string[] | undefined,
  allowed: string[]
): string[] {
  if (!allowed.length) return [];
  if (!requested || requested.length === 0) return allowed;

  const allowedSet = new Set(allowed.map((e) => e.toLowerCase().trim()));
  const filtered = requested
    .map((e) => e.toLowerCase().trim())
    .filter((e) => e && allowedSet.has(e));

  // Attacker asked for someone else's emails only → empty (no leak), not fallback-to-all
  return filtered;
}
