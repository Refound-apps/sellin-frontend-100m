import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import {
  addBrightDataZoneIps,
  getBrightDataBalance,
  getBrightDataConfig,
  getBrightDataStatus,
  getBrightDataZoneInfo,
  getBrightDataZoneIps,
  listBrightDataZones,
  removeBrightDataZoneIps,
} from '@/lib/brightdata';

export const dynamic = 'force-dynamic';

type CredentialUpdate = Database['public']['Tables']['credential_pg']['Update'];
type ProxyInsert = Database['public']['Tables']['proxy']['Insert'];
type ProxyField = 'proxy_ip' | 'proxy_ip_sbazar';

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isAdmin: false, user: null, error: 'Neautorizováno' };
  }

  const userEmail = (user.email || '').toLowerCase().trim();
  const { data: userCreds } = await supabase
    .from('credential_pg')
    .select('role')
    .or(`user_id.eq.${user.id},email.ilike.${userEmail}`)
    .eq('role', 'admin')
    .limit(1);

  const isAdmin = Boolean(userCreds && userCreds.length > 0);
  if (!isAdmin) {
    return { isAdmin: false, user, error: 'Přístup odepřen: vyžaduje roli administrátora' };
  }

  return { isAdmin: true, user, error: null };
}

function normalizeIp(value: string | null | undefined) {
  return (value || '').trim();
}

async function buildOverview(supabase: Awaited<ReturnType<typeof createClient>>, zone: string) {
  const { defaultZone } = getBrightDataConfig();
  const selectedZone = zone || defaultZone;

  const [zones, balance, status, zoneIps, zoneInfo, credsRes, proxyRes] = await Promise.all([
    listBrightDataZones(),
    getBrightDataBalance().catch(() => null),
    getBrightDataStatus().catch(() => null),
    getBrightDataZoneIps(selectedZone),
    getBrightDataZoneInfo(selectedZone).catch(() => null),
    supabase
      .from('credential_pg')
      .select('id, email, proxy_ip, proxy_ip_sbazar, bazos_email, sbazar_email, status_cz')
      .order('email', { ascending: true }),
    supabase.from('proxy').select('id, ip, used, bb_email').order('id', { ascending: true }),
  ]);

  if (credsRes.error) {
    throw new Error(credsRes.error.message);
  }

  const credentials = credsRes.data || [];
  const proxyPool = proxyRes.data || [];

  const byIp = new Map<
    string,
    {
      bazos: Array<{ id: number; email: string }>;
      sbazar: Array<{ id: number; email: string }>;
    }
  >();

  const ensure = (ip: string) => {
    if (!byIp.has(ip)) byIp.set(ip, { bazos: [], sbazar: [] });
    return byIp.get(ip)!;
  };

  for (const c of credentials) {
    const bazosIp = normalizeIp(c.proxy_ip);
    const sbazarIp = normalizeIp(c.proxy_ip_sbazar);
    if (bazosIp) ensure(bazosIp).bazos.push({ id: c.id, email: c.email });
    if (sbazarIp) ensure(sbazarIp).sbazar.push({ id: c.id, email: c.email });
  }

  const zoneIpSet = new Set(zoneIps.map((x) => x.ip));

  const ips = zoneIps
    .map((item) => {
      const assigned = byIp.get(item.ip) || { bazos: [], sbazar: [] };
      return {
        ip: item.ip,
        country: item.country,
        assigned_bazos: assigned.bazos,
        assigned_sbazar: assigned.sbazar,
        used_count: assigned.bazos.length + assigned.sbazar.length,
        is_free: assigned.bazos.length === 0 && assigned.sbazar.length === 0,
      };
    })
    .sort((a, b) => {
      if (a.is_free !== b.is_free) return a.is_free ? -1 : 1;
      return a.ip.localeCompare(b.ip);
    });

  const orphans = Array.from(byIp.entries())
    .filter(([ip]) => !zoneIpSet.has(ip))
    .map(([ip, assigned]) => ({
      ip,
      assigned_bazos: assigned.bazos,
      assigned_sbazar: assigned.sbazar,
      used_count: assigned.bazos.length + assigned.sbazar.length,
    }))
    .sort((a, b) => b.used_count - a.used_count);

  const accountsWithoutProxy = credentials
    .filter((c) => !normalizeIp(c.proxy_ip))
    .map((c) => ({
      id: c.id,
      email: c.email,
      bazos_email: c.bazos_email,
      sbazar_email: c.sbazar_email,
      status_cz: c.status_cz,
      proxy_ip_sbazar: c.proxy_ip_sbazar,
    }));

  const freeIps = ips.filter((x) => x.is_free);

  return {
    zone: selectedZone,
    zones,
    balance,
    status,
    zone_info: zoneInfo,
    stats: {
      zone_ips: ips.length,
      free_ips: freeIps.length,
      used_ips: ips.length - freeIps.length,
      orphan_ips: orphans.length,
      accounts_without_proxy: accountsWithoutProxy.length,
      assigned_unique:
        new Set(
          credentials
            .flatMap((c) => [normalizeIp(c.proxy_ip), normalizeIp(c.proxy_ip_sbazar)])
            .filter(Boolean)
        ).size,
      proxy_table_rows: proxyPool.length,
    },
    ips,
    orphans,
    accounts_without_proxy: accountsWithoutProxy,
    proxy_table: proxyPool,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const zone =
      request.nextUrl.searchParams.get('zone') ||
      getBrightDataConfig().defaultZone;

    const data = await buildOverview(supabase, zone);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('GET /api/admin/proxies error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { isAdmin, error } = await checkAdmin(supabase);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action || '').trim();
    const zone = String(body.zone || getBrightDataConfig().defaultZone).trim();

    if (action === 'assign') {
      const credentialId = Number(body.credential_id);
      const ip = normalizeIp(body.ip);
      const field: ProxyField =
        body.field === 'proxy_ip_sbazar' ? 'proxy_ip_sbazar' : 'proxy_ip';

      if (!credentialId || !ip) {
        return NextResponse.json(
          { success: false, error: 'Chybí credential_id nebo ip' },
          { status: 400 }
        );
      }

      const updates: CredentialUpdate = { [field]: ip };
      const { error: updateError } = await supabase
        .from('credential_pg')
        .update(updates)
        .eq('id', credentialId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    } else if (action === 'unassign') {
      const credentialId = Number(body.credential_id);
      const field: ProxyField =
        body.field === 'proxy_ip_sbazar' ? 'proxy_ip_sbazar' : 'proxy_ip';

      if (!credentialId) {
        return NextResponse.json(
          { success: false, error: 'Chybí credential_id' },
          { status: 400 }
        );
      }

      const updates: CredentialUpdate = { [field]: null };
      const { error: updateError } = await supabase
        .from('credential_pg')
        .update(updates)
        .eq('id', credentialId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    } else if (action === 'allocate') {
      const count = Math.min(Math.max(Number(body.count) || 1, 1), 20);
      const country = body.country ? String(body.country).trim().toLowerCase() : undefined;
      const result = await addBrightDataZoneIps({ zone, count, country });
      const overview = await buildOverview(supabase, zone);
      return NextResponse.json({
        success: true,
        data: overview,
        meta: { new_ips: result.new_ips || [], ips: result.ips || [] },
      });
    } else if (action === 'remove_ips') {
      const ips = Array.isArray(body.ips)
        ? body.ips.map((x: unknown) => String(x).trim()).filter(Boolean)
        : [];
      if (ips.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Chybí seznam IP ke smazání' },
          { status: 400 }
        );
      }
      await removeBrightDataZoneIps({ zone, ips });
    } else if (action === 'sync_free_pool') {
      const overview = await buildOverview(supabase, zone);
      const freeIps = overview.ips.filter((x) => x.is_free).map((x) => x.ip);

      const { error: deleteError } = await supabase.from('proxy').delete().neq('id', 0);
      if (deleteError) {
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      if (freeIps.length > 0) {
        const rows: ProxyInsert[] = freeIps.map((ip) => ({
          ip,
          used: false,
          bb_email: null,
        }));
        const { error: insertError } = await supabase.from('proxy').insert(rows);
        if (insertError) {
          return NextResponse.json(
            { success: false, error: insertError.message },
            { status: 500 }
          );
        }
      }

      const refreshed = await buildOverview(supabase, zone);
      return NextResponse.json({
        success: true,
        data: refreshed,
        meta: { synced: freeIps.length },
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Neznámá akce: ${action}` },
        { status: 400 }
      );
    }

    const data = await buildOverview(supabase, zone);
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Neočekávaná chyba';
    console.error('POST /api/admin/proxies error:', err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
