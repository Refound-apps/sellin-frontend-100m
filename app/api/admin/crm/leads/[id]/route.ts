import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type CrmLeadUpdate = Database['public']['Tables']['crm_leads']['Update'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Neplatné ID leadu' }, { status: 400 });
    }

    const body = await request.json();
    const supabase = await createClient();

    const allowedKeys: (keyof CrmLeadUpdate)[] = [
      'name',
      'company_name',
      'contact_person',
      'phone',
      'email',
      'website',
      'bazos_url',
      'bazos_phone_id',
      'category',
      'source',
      'stage',
      'tier',
      'notes',
      'response',
      'first_call_date',
      'onboarding_date',
      'offers_count',
      'location',
      'tags',
    ];

    const updates: CrmLeadUpdate = {
      updated_at: new Date().toISOString(),
    };

    for (const key of allowedKeys) {
      if (key in body) {
        if (key === 'tier' && body[key] !== null) {
          updates[key] = Number(body[key]);
        } else if (key === 'offers_count' && body[key] !== null) {
          updates[key] = Number(body[key]);
        } else {
          (updates as Record<string, unknown>)[key] = body[key];
        }
      }
    }

    const { data, error } = await supabase
      .from('crm_leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating CRM lead ${leadId}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('CRM lead PATCH exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: 'Neplatné ID leadu' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.from('crm_leads').delete().eq('id', leadId);

    if (error) {
      console.error(`Error deleting CRM lead ${leadId}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: leadId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('CRM lead DELETE exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
