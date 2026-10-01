import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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
    } = await supabase.auth.getUser();

    // Check user role
    let isAdmin = false;
    let userEmail = (user?.email || '').toLowerCase().trim();

    if (user) {
      const { data: userCreds } = await supabase
        .from('credential_pg')
        .select('role')
        .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
        .eq('role', 'admin')
        .limit(1);

      isAdmin = Boolean(userCreds && userCreds.length > 0);
    }

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

    // Permission check: admin can update any, seller can update if it matches their email or sbazar_email
    if (!isAdmin && user) {
      const isOwner =
        existing.user_id === user.id ||
        (existing.email && existing.email.toLowerCase().trim() === userEmail) ||
        (existing.sbazar_email && existing.sbazar_email.toLowerCase().trim() === userEmail);

      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Nemáte oprávnění upravovat tento účet.' },
          { status: 403 }
        );
      }
    }

    // Allowed fields to update
    const allowedFields = [
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
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in body) {
        let val = body[key];
        if (key === 'zipcode' && val !== null && val !== undefined && val !== '') {
          val = parseFloat(String(val).replace(/\s+/g, '')) || null;
        } else if (key === 'bazos_top_max' && val !== null && val !== undefined && val !== '') {
          val = parseFloat(String(val)) || null;
        } else if (typeof val === 'string') {
          val = val.trim();
        }
        updates[key] = val;
      }
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
      data: updated,
    });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/credentials/[id]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při aktualizaci účtu' },
      { status: 500 }
    );
  }
}
