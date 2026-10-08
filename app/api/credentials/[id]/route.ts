import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import { redactCredentialSecrets } from '@/lib/credentialsRedact';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

type CredentialUpdate = Database['public']['Tables']['credential_pg']['Update'];
type CredentialUpdateKey = keyof CredentialUpdate;

const ALLOWED_FIELDS: CredentialUpdateKey[] = [
  'email',
  'bazos_name',
  'bazos_email',
  'bazos_password',
  'bazos_bkod',
  'bazos_sk_bkod',
  'telephone1',
  'telephone2',
  'location',
  'zipcode',
  'zipcode_sk',
  'bazos_rewrite',
  'bazos_top_max',
  'status_cz',
  'status_sk',
  'sbazar_email',
  'sbazar_password',
  'sbazar_profile',
  'sbazar_cookie_ds',
  'proxy_ip',
  'proxy_ip_sbazar',
  'facebook_email',
  'facebook_password',
  'facebook_cuser',
  'facebook_xs',
  'tier',
];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const credId = parseInt(id, 10);
    if (isNaN(credId)) {
      return NextResponse.json({ success: false, error: 'Neplatné ID účtu' }, { status: 400 });
    }

    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);
    const userEmail = (user.email || '').toLowerCase().trim();

    // Check existing credential
    const { data: existing, error: fetchErr } = await supabase
      .from('credential_pg')
      .select('*')
      .eq('id', credId)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching credential before update:', fetchErr);
    }

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Účet s tímto ID nebyl nalezen.' },
        { status: 404 }
      );
    }

    // Permission: admin any; seller only own / linked subaccounts
    if (!isAdmin) {
      const ownerEmail = (existing.email || '').toLowerCase().trim();
      const isOwner =
        existing.user_id === user.id ||
        (ownerEmail && allowedEmails.includes(ownerEmail)) ||
        (existing.sbazar_email &&
          allowedEmails.includes(existing.sbazar_email.toLowerCase().trim())) ||
        (userEmail &&
          (ownerEmail === userEmail ||
            (existing.sbazar_email || '').toLowerCase().trim() === userEmail));

      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Nemáte oprávnění upravovat tento účet.' },
          { status: 403 }
        );
      }
    }

    const updates: CredentialUpdate = {};
    for (const key of ALLOWED_FIELDS) {
      if (!(key in body)) continue;

      let val = body[key];

      // Numeric columns (real) — empty string must become null, never ""
      if (key === 'zipcode' || key === 'bazos_top_max') {
        if (val === null || val === undefined || val === '') {
          val = null;
        } else {
          const parsed = parseFloat(String(val).replace(/\s+/g, ''));
          val = Number.isFinite(parsed) ? parsed : null;
        }
      } else if (typeof val === 'string') {
        val = val.trim();
        if (val === '') val = null;
      }

      (updates as Record<string, unknown>)[key] = val;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Žádné platné atributy k aktualizaci.' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateErr } = await supabase
      .from('credential_pg')
      .update(updates)
      .eq('id', credId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('Error updating credential in Supabase:', updateErr);
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: redactCredentialSecrets(updated as unknown as Record<string, unknown>),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba při aktualizaci účtu';
    console.error('Unexpected error in PUT /api/credentials/[id]:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
