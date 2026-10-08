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

/** Quote PostgREST or-filter values so emails with @ don't break parsing. */
function orEq(column: string, value: string): string {
  const safe = value.replace(/"/g, '');
  return `${column}.eq."${safe}"`;
}

function orIlike(column: string, value: string): string {
  const safe = value.replace(/"/g, '');
  return `${column}.ilike."${safe}"`;
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

  const credSelect = 'role, email, sbazar_email, bazos_email, facebook_email';

  // Split queries — more reliable than a single .or() with @ in emails
  const [byUserId, byEmail] = await Promise.all([
    supabase.from('credential_pg').select(credSelect).eq('user_id', user.id),
    userEmail
      ? supabase
          .from('credential_pg')
          .select(credSelect)
          .or(
            [
              orIlike('email', userEmail),
              orIlike('sbazar_email', userEmail),
              orEq('email', userEmail),
              orEq('sbazar_email', userEmail),
            ].join(',')
          )
      : Promise.resolve({ data: [] as CredRow[] | null, error: null }),
  ]);

  if (byUserId.error) {
    console.error('[offerScope] by user_id:', byUserId.error);
  }
  if (byEmail && 'error' in byEmail && byEmail.error) {
    console.error('[offerScope] by email:', byEmail.error);
  }

  let isAdmin = false;
  const sbazarEmails = new Set<string>();
  const seen = new Set<string>();

  const ingest = (rows: CredRow[] | null | undefined) => {
    for (const cred of rows || []) {
      const key = `${cred.email || ''}|${cred.sbazar_email || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (cred.role === 'admin') isAdmin = true;
      addCredEmails(emails, cred);
      const sb = norm(cred.sbazar_email);
      if (sb) sbazarEmails.add(sb);
    }
  };

  ingest(byUserId.data as CredRow[] | null);
  ingest(byEmail.data as CredRow[] | null);

  if (sbazarEmails.size > 0) {
    // Fetch siblings per sbazar email (ilike = case-insensitive; .in is not)
    const siblingResults = await Promise.all(
      Array.from(sbazarEmails).map((sb) =>
        supabase.from('credential_pg').select(credSelect).ilike('sbazar_email', sb)
      )
    );
    for (const res of siblingResults) {
      if (res.error) {
        console.error('[offerScope] siblings:', res.error);
        continue;
      }
      ingest(res.data as CredRow[] | null);
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
