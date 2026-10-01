'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AssignedAccount = { id: number; email: string };

type ProxyHealthInfo = {
  status: string;
  bazos_cz_status?: string | null;
  bazos_sk_status?: string | null;
  sbazar_status?: string | null;
  blocked_platforms?: string[];
  last_checked_at?: string | null;
  last_error?: string | null;
  replaced_by?: string | null;
};

type ProxyIpRow = {
  ip: string;
  country: string | null;
  assigned_bazos: AssignedAccount[];
  assigned_sbazar: AssignedAccount[];
  used_count: number;
  is_free: boolean;
  health?: ProxyHealthInfo | null;
};

type OrphanIp = {
  ip: string;
  assigned_bazos: AssignedAccount[];
  assigned_sbazar: AssignedAccount[];
  used_count: number;
  health?: ProxyHealthInfo | null;
};

type AccountWithoutProxy = {
  id: number;
  email: string;
  bazos_email: string | null;
  sbazar_email: string | null;
  status_cz: string | null;
  proxy_ip_sbazar: string | null;
};

type ProxiesOverview = {
  zone: string;
  zones: Array<{ name: string; type: string; status?: string }>;
  balance: { balance: number; pending_costs?: number } | null;
  status: { status: string; customer: string; can_make_requests: boolean } | null;
  stats: {
    zone_ips: number;
    free_ips: number;
    used_ips: number;
    orphan_ips: number;
    accounts_without_proxy: number;
    assigned_unique: number;
    proxy_table_rows: number;
    health_ok: number;
    health_blocked: number;
    health_checked: number;
  };
  ips: ProxyIpRow[];
  orphans: OrphanIp[];
  accounts_without_proxy: AccountWithoutProxy[];
};

type FilterMode = 'all' | 'free' | 'used';

const COUNTRY_LABELS: Record<string, string> = {
  cz: 'Česko',
  sk: 'Slovensko',
  de: 'Německo',
  at: 'Rakousko',
  pl: 'Polsko',
  dk: 'Dánsko',
  ua: 'Ukrajina',
  nl: 'Nizozemsko',
};

function countryLabel(code: string | null) {
  if (!code) return '—';
  const key = code.toLowerCase();
  return COUNTRY_LABELS[key] || code.toUpperCase();
}

function healthBadge(status?: string | null) {
  const s = (status || 'unknown').toLowerCase();
  if (s === 'ok') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }
  if (s === 'blocked') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }
  if (s === 'dead') {
    return 'border-amber-200 bg-amber-50 text-amber-900';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export default function ProxiesView() {
  const [data, setData] = useState<ProxiesOverview | null>(null);
  const [zone, setZone] = useState('data_center');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [allocateCount, setAllocateCount] = useState(1);
  const [allocateCountry, setAllocateCountry] = useState('cz');
  const [assignAccountId, setAssignAccountId] = useState<number | ''>('');
  const [assignIp, setAssignIp] = useState('');
  const [assignField, setAssignField] = useState<'proxy_ip' | 'proxy_ip_sbazar'>('proxy_ip');

  const load = useCallback(async (nextZone?: string) => {
    try {
      setLoading(true);
      setError(null);
      const z = nextZone || zone;
      const res = await fetch(`/api/admin/proxies?zone=${encodeURIComponent(z)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Nepodařilo se načíst proxy');
      }
      setData(json.data);
      setZone(json.data.zone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neočekávaná chyba');
    } finally {
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    load('data_center');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (
    payload: Record<string, unknown>,
    successMessage?: string
  ): Promise<boolean> => {
    try {
      setBusy(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/admin/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone, ...payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Akce selhala');
      }
      setData(json.data);
      if (successMessage) setMessage(successMessage);
      if (json.meta?.new_ips?.length) {
        setMessage(
          `Přidáno ${json.meta.new_ips.length} IP: ${json.meta.new_ips.join(', ')}`
        );
      }
      if (typeof json.meta?.synced === 'number') {
        setMessage(`Synchronizováno ${json.meta.synced} volných IP do tabulky proxy`);
      }
      if (typeof json.meta?.queued === 'number') {
        setMessage(
          `Health check zařazen: ${json.meta.queued} IP (volných kandidátů ${json.meta.candidateFreeIps ?? 0})`
        );
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akce selhala');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const filteredIps = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.ips.filter((row) => {
      if (filter === 'free' && !row.is_free) return false;
      if (filter === 'used' && row.is_free) return false;
      if (!q) return true;
      const hay = [
        row.ip,
        row.country,
        ...row.assigned_bazos.map((a) => a.email),
        ...row.assigned_sbazar.map((a) => a.email),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data, filter, search]);

  const freeIpOptions = useMemo(
    () => (data?.ips || []).filter((x) => x.is_free).map((x) => x.ip),
    [data]
  );

  return (
    <div>
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            Bright Data · Scraping proxy
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Správa proxy IP
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Pool Bright Data IP, přiřazení k Bazoš / Sbazar účtům a detekce orphan IP,
            které už v zóně nejsou.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <select
            value={zone}
            onChange={(e) => {
              setZone(e.target.value);
              load(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs"
          >
            {(data?.zones || [{ name: 'data_center', type: 'dc' }]).map((z) => (
              <option key={z.name} value={z.name}>
                {z.name} ({z.type})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading || busy}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            Obnovit
          </button>
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => {
              if (
                !confirm(
                  'Spustit health check všech přiřazených proxy IP?\nBlokované IP se flagnout a nahradí volnými.'
                )
              ) {
                return;
              }
              runAction(
                { action: 'run_health_check', auto_replace: true },
                'Health check zařazen do fronty na backendu'
              );
            }}
            className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-2xs hover:bg-sky-500 disabled:opacity-50"
          >
            Spustit health check
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          Načítám Bright Data a přiřazení z DB…
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kredit</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {data.balance ? `$${data.balance.balance.toFixed(2)}` : '—'}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                pending {data.balance?.pending_costs?.toFixed(2) ?? '0'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">IP v zóně</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {data.stats.zone_ips}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{data.zone}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Volné</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-emerald-700">
                {data.stats.free_ips}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">bez účtu</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Použité</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                {data.stats.used_ips}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">aspoň 1 účet</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Orphans</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-amber-700">
                {data.stats.orphan_ips}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-600/80">mimo aktuální pool</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bez proxy</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-rose-700">
                {data.stats.accounts_without_proxy}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">účtů bez proxy_ip</p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Health OK</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-emerald-700">
                {data.stats.health_ok ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                blocked/dead {data.stats.health_blocked ?? 0}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-black text-slate-950">Přiřadit volnou IP účtu</h2>
              <p className="mt-1 text-xs text-slate-500">
                Nastaví <code className="text-[11px]">proxy_ip</code> nebo{' '}
                <code className="text-[11px]">proxy_ip_sbazar</code> v credential_pg.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-slate-600">
                  Účet bez proxy
                  <select
                    value={assignAccountId}
                    onChange={(e) =>
                      setAssignAccountId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="">Vyber účet…</option>
                    {data.accounts_without_proxy.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.email}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Volná IP
                  <select
                    value={assignIp}
                    onChange={(e) => setAssignIp(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="">Vyber IP…</option>
                    {freeIpOptions.map((ip) => (
                      <option key={ip} value={ip}>
                        {ip}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Pole
                  <select
                    value={assignField}
                    onChange={(e) =>
                      setAssignField(e.target.value as 'proxy_ip' | 'proxy_ip_sbazar')
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="proxy_ip">proxy_ip (Bazoš)</option>
                    <option value="proxy_ip_sbazar">proxy_ip_sbazar</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={busy || !assignAccountId || !assignIp}
                    onClick={async () => {
                      const ip = assignIp;
                      const ok = await runAction(
                        {
                          action: 'assign',
                          credential_id: assignAccountId,
                          ip,
                          field: assignField,
                        },
                        `IP ${ip} přiřazena`
                      );
                      if (ok) {
                        setAssignAccountId('');
                        setAssignIp('');
                      }
                    }}
                    className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    Přiřadit
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-black text-slate-950">Alokovat nové IP (Bright Data)</h2>
              <p className="mt-1 text-xs text-slate-500">
                Přidá static IP do zóny <strong>{zone}</strong>. Účtuje se podle tarifu Bright Data.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="block text-xs font-bold text-slate-600">
                  Počet
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={allocateCount}
                    onChange={(e) => setAllocateCount(Number(e.target.value) || 1)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Země
                  <select
                    value={allocateCountry}
                    onChange={(e) => setAllocateCountry(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800"
                  >
                    <option value="cz">cz — Česko</option>
                    <option value="sk">sk — Slovensko</option>
                    <option value="de">de — Německo</option>
                    <option value="at">at — Rakousko</option>
                    <option value="pl">pl — Polsko</option>
                    <option value="">bez preference</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (
                        !confirm(
                          `Opravdu alokovat ${allocateCount} IP (${allocateCountry || 'any'}) do zóny ${zone}?`
                        )
                      ) {
                        return;
                      }
                      runAction({
                        action: 'allocate',
                        count: allocateCount,
                        country: allocateCountry || undefined,
                      });
                    }}
                    className="w-full rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
                  >
                    Alokovat
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  runAction(
                    { action: 'sync_free_pool' },
                    'Volné IP synchronizovány do tabulky proxy'
                  )
                }
                className="mt-3 text-xs font-semibold text-slate-600 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Sync volných IP → tabulka proxy ({data.stats.proxy_table_rows} řádků teď)
              </button>
            </div>
          </div>

          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(
                [
                  ['all', 'Vše'],
                  ['free', 'Volné'],
                  ['used', 'Použité'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    filter === id
                      ? 'bg-slate-950 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat IP / e-mail…"
              className="w-full sm:w-72 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">IP</th>
                    <th className="px-4 py-3 font-bold">Země</th>
                    <th className="px-4 py-3 font-bold">Stav</th>
                    <th className="px-4 py-3 font-bold">Health</th>
                    <th className="px-4 py-3 font-bold">Bazoš (proxy_ip)</th>
                    <th className="px-4 py-3 font-bold">Sbazar</th>
                    <th className="px-4 py-3 font-bold">Akce</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIps.map((row) => (
                    <tr key={row.ip} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">
                        {row.ip}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {countryLabel(row.country)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                            row.is_free
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}
                        >
                          {row.is_free ? 'Volná' : `${row.used_count}×`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-bold ${healthBadge(
                              row.health?.status
                            )}`}
                          >
                            {row.health?.status || 'neověřeno'}
                          </span>
                          {row.health?.last_checked_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(row.health.last_checked_at).toLocaleString('cs-CZ')}
                            </span>
                          )}
                          {row.health?.replaced_by && (
                            <span className="text-[10px] font-medium text-amber-700">
                              → {row.health.replaced_by}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AccountChips
                          accounts={row.assigned_bazos}
                          busy={busy}
                          onUnassign={(id) =>
                            runAction(
                              { action: 'unassign', credential_id: id, field: 'proxy_ip' },
                              'Proxy odebrána'
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <AccountChips
                          accounts={row.assigned_sbazar}
                          busy={busy}
                          onUnassign={(id) =>
                            runAction(
                              {
                                action: 'unassign',
                                credential_id: id,
                                field: 'proxy_ip_sbazar',
                              },
                              'Sbazar proxy odebrána'
                            )
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        {row.is_free ? (
                          <span className="text-[11px] text-slate-400">připravená k přiřazení</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {filteredIps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                        Žádné IP neodpovídají filtru.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data.orphans.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-200/90 bg-amber-50/40 p-5 shadow-2xs">
              <h2 className="text-sm font-black text-amber-950">
                Orphan IP ({data.orphans.length})
              </h2>
              <p className="mt-1 text-xs text-amber-900/80">
                Přiřazené v účtech, ale nejsou v aktuálním Bright Data poolu zóny{' '}
                <strong>{data.zone}</strong>. Scraping přes ně pravděpodobně nefunguje.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-amber-800/70">
                    <tr>
                      <th className="px-2 py-2 font-bold">IP</th>
                      <th className="px-2 py-2 font-bold">Bazoš</th>
                      <th className="px-2 py-2 font-bold">Sbazar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100">
                    {data.orphans.map((row) => (
                      <tr key={row.ip}>
                        <td className="px-2 py-2 font-mono text-xs font-semibold">{row.ip}</td>
                        <td className="px-2 py-2">
                          <AccountChips
                            accounts={row.assigned_bazos}
                            busy={busy}
                            onUnassign={(id) =>
                              runAction(
                                { action: 'unassign', credential_id: id, field: 'proxy_ip' },
                                'Orphan proxy odebrána'
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-2">
                          <AccountChips
                            accounts={row.assigned_sbazar}
                            busy={busy}
                            onUnassign={(id) =>
                              runAction(
                                {
                                  action: 'unassign',
                                  credential_id: id,
                                  field: 'proxy_ip_sbazar',
                                },
                                'Orphan Sbazar proxy odebrána'
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function AccountChips({
  accounts,
  onUnassign,
  busy,
}: {
  accounts: AssignedAccount[];
  onUnassign: (id: number) => void;
  busy: boolean;
}) {
  if (accounts.length === 0) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {accounts.map((a) => (
        <div key={`${a.id}-${a.email}`} className="flex items-center gap-2">
          <span className="truncate text-xs font-medium text-slate-800" title={a.email}>
            {a.email}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Odebrat proxy z účtu ${a.email}?`)) onUnassign(a.id);
            }}
            className="shrink-0 rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-white hover:text-rose-700 disabled:opacity-50"
          >
            Odebrat
          </button>
        </div>
      ))}
    </div>
  );
}
