'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/api';
import { formatPhoneNumber } from './offerStatus';

interface PlatformSummary {
  name: string;
  icon: string;
  badge: string;
  desc: string;
  activeCount: number;
  highlight: string;
}

export default function AccountsView() {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setAccounts(data);
    } catch (err) {
      setError('Nepodařilo se načíst napojené účty. Zkuste to prosím znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!searchInput.trim()) return accounts;
    const q = searchInput.trim().toLowerCase();
    return accounts.filter((acc) => {
      const haystack = [
        acc.email,
        acc.bazos_name,
        acc.telephone1,
        acc.telephone2,
        acc.location,
        acc.zipcode,
        acc.bazos_email,
        acc.sbazar_email,
        acc.facebook_email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [accounts, searchInput]);

  const platformSummaries: PlatformSummary[] = useMemo(() => {
    const bazosCount = accounts.filter((a) => Boolean(a.bazos_email)).length;
    const sbazarCount = accounts.filter((a) => Boolean(a.sbazar_email)).length;
    const fbCount = accounts.filter((a) => Boolean(a.facebook_email)).length;

    return [
      {
        name: 'Bazoš.cz / SK',
        icon: '🏷️',
        badge: `${bazosCount} účtů`,
        desc: 'Automatická publikace inzerátů, podpora SMS ověření a TOPování.',
        activeCount: bazosCount,
        highlight: 'Největší objem poptávek',
      },
      {
        name: 'Sbazar.cz',
        icon: '🛒',
        badge: `${sbazarCount} účtů`,
        desc: 'Propojení se Seznam.cz, automatická synchronizace prodejních profilů.',
        activeCount: sbazarCount,
        highlight: 'Silná regionální inzerce',
      },
      {
        name: 'Facebook Marketplace',
        icon: '📘',
        badge: `${fbCount} účtů`,
        desc: 'Sociální inzertní kanál pro lokální i celorepublikový prodej.',
        activeCount: fbCount,
        highlight: 'Rychlá komunikace',
      },
      {
        name: 'E-shop Duplux',
        icon: '🛍️',
        badge: 'Aktivní',
        desc: 'Vlastní centrální online e-shop pro zákazníky s přímým nákupem.',
        activeCount: accounts.length,
        highlight: 'Bez provizí třetím stranám',
      },
    ];
  }, [accounts]);

  return (
    <div>
      {/* Top Header matching Moje nabídka */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Integrace & Kanály
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Napojení účtů
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Správa přihlašovacích údajů a synchronizace prodejních kanálů na Bazoš, Sbazar, Facebook a E-shop.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/create"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
          >
            <span>+</span>
            <span>Vytvořit inzerát</span>
          </Link>
        </div>
      </div>

      {/* Platform Overview Hub Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
        {platformSummaries.map((platform) => (
          <div
            key={platform.name}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{platform.icon}</span>
                <span className="inline-flex items-center rounded-lg border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                  {platform.badge}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-950">{platform.name}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{platform.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-700">{platform.highlight}</span>
              <span className="font-bold text-slate-400">● Aktivní</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Section Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Aktivní napojené účty</h2>
          <p className="text-xs text-slate-500">Účty evidované v centrální databázi pro automatickou synchronizaci inzerátů.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Hledat účet, telefon, jméno..."
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-950 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Načítám napojené účty…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-2xs">
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            onClick={() => loadAccounts()}
            className="mt-4 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 active:scale-95 transition-all"
          >
            Zkusit znovu
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-950">Nebyly nalezeny žádné účty</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Pro zadané vyhledávací kritérium se nenašel žádný prodejní účet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => {
            const hasBazos = Boolean(account.bazos_email);
            const hasSbazar = Boolean(account.sbazar_email);
            const hasFb = Boolean(account.facebook_email);

            return (
              <div
                key={account.id}
                className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <h3 className="font-bold text-base text-slate-950 leading-snug">
                        {account.bazos_name || 'Účet prodejce'}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium truncate max-w-[220px]" title={account.email}>
                        {account.email}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{account.status_cz === 'OK' ? 'Aktivní' : 'Napojeno'}</span>
                    </span>
                  </div>

                  {/* Phone & Location Strip */}
                  <div className="my-3 space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Telefon:</span>
                      {account.telephone1 ? (
                        <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                          <svg className="h-3 w-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{formatPhoneNumber(account.telephone1)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Neuveden</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">Lokalita:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]">
                        {account.location || account.zipcode
                          ? `${account.location || ''}${account.location && account.zipcode ? ', ' : ''}${account.zipcode || ''}`
                          : 'Neuvedena'}
                      </span>
                    </div>
                  </div>

                  {/* Platform Pills */}
                  <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Synchronizované kanály
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                          hasBazos
                            ? 'border-slate-200 bg-white text-slate-800'
                            : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                        }`}
                      >
                        <span>🏷️ Bazoš</span>
                        <span>{hasBazos ? '✓' : '—'}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                          hasSbazar
                            ? 'border-slate-200 bg-white text-slate-800'
                            : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                        }`}
                      >
                        <span>🛒 Sbazar</span>
                        <span>{hasSbazar ? '✓' : '—'}</span>
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                          hasFb
                            ? 'border-slate-200 bg-white text-slate-800'
                            : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                        }`}
                      >
                        <span>📘 FB</span>
                        <span>{hasFb ? '✓' : '—'}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                        <span>🛍️ E-shop</span>
                        <span>✓</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">ID #{account.id}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(account)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-900 hover:text-white hover:border-transparent active:scale-95 transition-all shadow-2xs"
                  >
                    <span>Konfigurace</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Configuration Modal matching OfferModal */}
      {selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950 leading-tight">
                    {selectedAccount.bazos_name || 'Detail napojeného účtu'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedAccount.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                aria-label="Zavřít"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Card 1: Bazoš konfigurace */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                    <span>🏷️</span> Bazoš konfigurace
                  </h4>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {selectedAccount.bazos_email ? 'Aktivní' : 'Nenastaveno'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Bazoš přihlašovací email</span>
                  <span className="font-medium text-slate-900">{selectedAccount.bazos_email || '—'}</span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Jméno na Bazoši</span>
                  <span className="font-bold text-slate-900">{selectedAccount.bazos_name || '—'}</span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Ověřovací B-kód</span>
                  <span className="font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-800 text-[11px]">
                    {selectedAccount.bazos_bkod || 'Neuveden'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Lokalita / PSČ</span>
                  <span className="font-medium text-slate-900">
                    {selectedAccount.location || '—'} {selectedAccount.zipcode ? `(${selectedAccount.zipcode})` : ''}
                  </span>
                </div>
              </div>

              {/* Card 2: Sbazar konfigurace */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                    <span>🛒</span> Sbazar konfigurace
                  </h4>
                  <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {selectedAccount.sbazar_email ? 'Aktivní' : 'Nenastaveno'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Seznam.cz účet</span>
                  <span className="font-medium text-slate-900">{selectedAccount.sbazar_email || '—'}</span>
                </div>

                {selectedAccount.sbazar_profile && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-semibold text-slate-500">Veřejný profil prodejce</span>
                    <a
                      href={selectedAccount.sbazar_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Otevřít profil na Sbazar.cz</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Card 3: Systémový status */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2 text-xs shadow-2xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-2">
                  Systémový stav účtu
                </h4>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Status CZ</span>
                  <span className="font-bold text-emerald-700">{selectedAccount.status_cz || 'Neznámý'}</span>
                </div>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <span className="font-semibold text-slate-500">Status SK</span>
                  <span className="font-medium text-slate-800">{selectedAccount.status_sk || '—'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Interní ID záznamu</span>
                  <span className="font-mono text-slate-500">#{selectedAccount.id}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="rounded-xl border border-slate-200/90 bg-white px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
