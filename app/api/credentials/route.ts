import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import { redactCredentialSecrets } from '@/lib/credentialsRedact';
import { resolveCallerOfferScope } from '@/lib/offerScope';

export const dynamic = 'force-dynamic';

type CredentialInsert = Database['public']['Tables']['credential_pg']['Insert'];
type CredentialRow = Database['public']['Tables']['credential_pg']['Row'];

const SAFE_SELECT =
  'id, email, bazos_name, bazos_email, telephone1, telephone2, location, zipcode, zipcode_sk, bazos_rewrite, bazos_top_max, status_cz, status_sk, sbazar_email, sbazar_profile, proxy_ip, proxy_ip_sbazar, facebook_email, role, user_id, created_at, bazos_bkod, bazos_sk_bkod, sbazar_cookie_ds, bazos_password, sbazar_password, facebook_password, facebook_cuser, facebook_xs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const { isAdmin, allowedEmails } = await resolveCallerOfferScope(supabase, user);
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    let query = supabase
      .from('credential_pg')
      .select(SAFE_SELECT)
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });

    if (!isAdmin) {
      if (allowedEmails.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      query = query.in('email', allowedEmails);
    } else if (emailParam) {
      const clean = emailParam.toLowerCase().trim();
      query = query.or(
        `email.ilike.${clean},sbazar_email.ilike.${clean},bazos_email.ilike.${clean}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching credentials from Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const redacted = ((data || []) as unknown as CredentialRow[]).map((row) =>
      redactCredentialSecrets(row as unknown as Record<string, unknown>)
    );

    return NextResponse.json({
      success: true,
      data: redacted,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba při načítání účtů';
    console.error('Unexpected error in GET /api/credentials:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Neautorizováno' }, { status: 401 });
    }

    const body = await request.json();
    const { isAdmin } = await resolveCallerOfferScope(supabase, user);
    const userEmail = (user.email || '').toLowerCase().trim();

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'E-mail účtu je povinný.' },
        { status: 400 }
      );
    }

    const newRecord: CredentialInsert = {
      email: body.email.trim(),
      bazos_name: body.bazos_name?.trim() || null,
      bazos_email: body.bazos_email?.trim() || null,
      bazos_password: body.bazos_password || null,
      bazos_bkod: body.bazos_bkod?.trim() || null,
      bazos_sk_bkod: body.bazos_sk_bkod?.trim() || null,
      telephone1: body.telephone1?.trim() || null,
      telephone2: body.telephone2?.trim() || null,
      location: body.location?.trim() || 'Praha',
      zipcode: body.zipcode ? parseFloat(String(body.zipcode).replace(/\s+/g, '')) : 11000,
      zipcode_sk: body.zipcode_sk?.trim() || null,
      bazos_rewrite: body.bazos_rewrite ?? true,
      bazos_top_max: body.bazos_top_max ? parseFloat(String(body.bazos_top_max)) : 0,
      status_cz: body.status_cz || 'OK',
      status_sk: body.status_sk || null,
      sbazar_email: body.sbazar_email?.trim() || userEmail || null,
      sbazar_password: body.sbazar_password || null,
      sbazar_profile: body.sbazar_profile?.trim() || null,
      sbazar_cookie_ds: body.sbazar_cookie_ds?.trim() || null,
      proxy_ip: body.proxy_ip?.trim() || null,
      proxy_ip_sbazar: body.proxy_ip_sbazar?.trim() || null,
      // Never allow self-promotion to admin
      role: isAdmin && body.role === 'admin' ? 'admin' : 'seller',
      user_id: user.id,
    };

    const { data: created, error } = await supabase
      .from('credential_pg')
      .insert(newRecord)
      .select(SAFE_SELECT)
      .single();

    if (error) {
      console.error('Error inserting credential in Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: redactCredentialSecrets(created as unknown as Record<string, unknown>),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chyba při vytváření účtu';
    console.error('Unexpected error in POST /api/credentials:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
