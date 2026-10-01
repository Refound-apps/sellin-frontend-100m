import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');

    let query = supabase
      .from('credential_pg')
      .select('*')
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false });

    if (emailParam) {
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

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/credentials:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při načítání účtů' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = (user?.email || '').toLowerCase().trim();

    // Required field
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'E-mail účtu je povinný.' },
        { status: 400 }
      );
    }

    const newRecord: Record<string, any> = {
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
      role: body.role || 'seller',
      user_id: user?.id || null,
    };

    const { data: created, error } = await supabase
      .from('credential_pg')
      .insert(newRecord as any)
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting credential in Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/credentials:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Chyba při vytváření účtu' },
      { status: 500 }
    );
  }
}
