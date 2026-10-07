import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

export const dynamic = 'force-dynamic';

type CrmLeadInsert = Database['public']['Tables']['crm_leads']['Insert'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
    const tab = searchParams.get('tab') || 'worklist';
    const stage = searchParams.get('stage') || 'all';
    const category = searchParams.get('category') || 'all';
    const source = searchParams.get('source') || 'all';
    const tier = searchParams.get('tier') || 'all';
    const bucket = searchParams.get('bucket') || 'all';
    const search = searchParams.get('search')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || (tab === 'pipeline' ? 'stage_prio' : 'id');
    const sortOrder = searchParams.get('sortOrder') === 'desc';

    const supabase = await createClient();

    // 1. Stats query (fast RPC)
    const { data: statsData } = await supabase.rpc('get_crm_stats');

    // Daily GTM worklist — prioritized call queue
    if (tab === 'worklist') {
      const from = (page - 1) * limit;
      const { data: worklistRaw, error: worklistError } = await supabase.rpc('get_crm_daily_worklist', {
        p_limit: limit,
        p_offset: from,
        p_bucket: bucket !== 'all' ? bucket : null,
        p_search: search || null,
      });

      if (worklistError) {
        console.error('Error fetching CRM worklist:', worklistError);
        return NextResponse.json({ error: worklistError.message }, { status: 500 });
      }

      const payload = (worklistRaw || {}) as {
        leads?: unknown[];
        total?: number;
        buckets?: {
          stuck?: number;
          warm?: number;
          contacted?: number;
          cold_a?: number;
          total?: number;
        };
      };
      const total = payload.total ?? 0;

      return NextResponse.json({
        leads: payload.leads || [],
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats: statsData || null,
        worklistBuckets: {
          stuck: payload.buckets?.stuck ?? 0,
          warm: payload.buckets?.warm ?? 0,
          contacted: payload.buckets?.contacted ?? 0,
          cold_a: payload.buckets?.cold_a ?? 0,
          total: payload.buckets?.total ?? total,
        },
      });
    }

    // 2. Build leads query
    let query = supabase.from('crm_leads').select('*', { count: 'exact' });

    // Tab filtering
    if (tab === 'pipeline') {
      query = query.or('stage.in.(won,onboarding,trial,warm,contacted),notes.neq.""');
    } else if (tab === 'firmy') {
      query = query.eq('source', 'Firmy.cz');
    } else if (tab === 'bazos') {
      query = query.in('source', ['Bazoš CZ', 'Bazoš SK']);
    } else if (tab === 'eshop') {
      query = query.or('source.ilike.%E-shop%,source.eq.Katalog e-shopů');
    }

    // Specific filters
    if (stage && stage !== 'all') {
      query = query.eq('stage', stage);
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (source && source !== 'all') {
      query = query.eq('source', source);
    }
    if (tier && tier !== 'all') {
      const tierNum = parseInt(tier, 10);
      if (!isNaN(tierNum)) {
        query = query.eq('tier', tierNum);
      }
    }

    // Fulltext search
    if (search) {
      const term = search.replace(/[%_,]/g, '');
      if (term) {
        query = query.or(
          `name.ilike.%${term}%,company_name.ilike.%${term}%,contact_person.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%,website.ilike.%${term}%,notes.ilike.%${term}%,bazos_phone_id.ilike.%${term}%`
        );
      }
    }

    // Sorting
    if (sortBy === 'tier') {
      query = query.order('tier', { ascending: !sortOrder, nullsFirst: false });
    } else if (sortBy === 'offers_count') {
      query = query.order('offers_count', { ascending: !sortOrder });
    } else if (sortBy === 'name') {
      query = query.order('name', { ascending: !sortOrder });
    } else if (sortBy === 'updated_at') {
      query = query.order('updated_at', { ascending: !sortOrder });
    } else {
      // Default: sort by id
      query = query.order('id', { ascending: !sortOrder });
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: leads, count, error } = await query;

    if (error) {
      console.error('Error fetching CRM leads:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      leads: leads || [],
      total,
      page,
      limit,
      totalPages,
      stats: statsData || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('CRM leads GET exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const leadPayload: CrmLeadInsert = {
      name: body.name?.trim() || 'Nový kontakt',
      company_name: body.company_name?.trim() || null,
      contact_person: body.contact_person?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      website: body.website?.trim() || null,
      bazos_url: body.bazos_url?.trim() || null,
      bazos_phone_id: body.bazos_phone_id?.trim() || null,
      category: body.category?.trim() || 'Ostatní',
      source: body.source?.trim() || 'Přímý kontakt',
      stage: body.stage?.trim() || 'lead',
      tier: body.tier ? Number(body.tier) : 3,
      notes: body.notes?.trim() || null,
      response: body.response?.trim() || null,
      first_call_date: body.first_call_date?.trim() || null,
      onboarding_date: body.onboarding_date?.trim() || null,
      offers_count: body.offers_count ? Number(body.offers_count) : 0,
      location: body.location?.trim() || 'ČR',
      tags: Array.isArray(body.tags) ? body.tags : ['Manuálně vytvořeno'],
      origin_sheets: ['Ruční zadání'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('crm_leads')
      .insert(leadPayload)
      .select()
      .single();

    if (error) {
      console.error('Error inserting CRM lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lead: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('CRM leads POST exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
