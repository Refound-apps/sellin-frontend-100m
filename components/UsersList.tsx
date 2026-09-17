'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/api';
import { formatPhoneNumber } from './offerStatus';

type StatusFilter = 'all' | 'ok' | 'not-working' | 'unknown';
type PlatformFilter = 'all' | 'bazos' | 'sbazar' | 'facebook';

function statusInfo(status: string | null) {
  if (status === 'OK') {
    return {
      label: 'Stav OK',
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
    };
  }
  if (status && status.toLowerCase().includes('not working')) {
    return {
      label: 'Chyba spojení',
      dot: 'bg-rose-500',
      badge: 'bg-rose-50 text-rose-800 border-rose-200/90',
    };
  }
  return {
    label: status || 'Neznámý stav',
    dot: 'bg-slate-400',
    badge: 'bg-slate-50 text-slate-700 border-slate-200/90',
  };
}

function matchesSearch(user: User, query: string) {
  const cleanPhone = (user.telephone1 || '').replace(/\s+/g, '');
  const cleanPhone2 = (user.telephone2 || '').replace(/\s+/g, '');
  const haystack = [
    user.email,
    user.telephone1,
    cleanPhone,
    user.telephone2,
    cleanPhone2,
    user.bazos_name,
    user.bazos_email,
    user.sbazar_email,
    user.facebook_email,
    user.location,
    user.zipcode,
    user.zipcode_sk,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Nepodařilo se načíst uživatele. Zkuste to prosím znovu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim().toLowerCase());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (searchQuery && !matchesSearch(user, searchQuery)) return false;

      if (statusFilter === 'ok' && user.status_cz !== 'OK') return false;
      if (statusFilter === 'not-working' && (!user.status_cz || !user.status_cz.toLowerCase().includes('not working'))) {
        return false;
      }
      if (statusFilter === 'unknown' && user.status_cz) return false;

      if (platformFilter === 'bazos' && !user.bazos_email) return false;
      if (platformFilter === 'sbazar' && !user.sbazar_email) return false;
      if (platformFilter === 'facebook' && !user.facebook_email) return false;

      return true;
    });
  }, [users, searchQuery, statusFilter, platformFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      ok: users.filter((user) => user.status_cz === 'OK').length,
      bazos: users.filter((user) => Boolean(user.bazos_email)).length,
      sbazar: users.filter((user) => Boolean(user.sbazar_email)).length,
      facebook: users.filter((user) => Boolean(user.facebook_email)).length,
    };
  }, [users]);

  return (
    <div>
      {/* Top Header matching Moje nabídka */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Správa systému · Databáze prodejců
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
            Uživatelé a prodejci
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Přehled registrovaných prodejců, kontaktních telefonů a stavu synchronizace na inzertních platformách.
          </p>
        </div>

        <Link
          href="/accounts"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all self-start sm:self-auto"
        >
          <span>🔗</span>
          <span>Napojení účtů</span>
        </Link>
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Celkem účtů</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">registrovaných</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status OK</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-emerald-700">{stats.ok}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600/80 font-medium">plně funkční</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bazoš</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{stats.bazos}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">napojených profilů</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sbazar</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{stats.sbazar}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">napojených profilů</p>
        </div>
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Facebook</p>
          <p className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">{stats.facebook}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">napojených profilů</p>
        </div>
      </div>

      {/* Search Input Bar & Filters */}
      <div className="mb-6 space-y-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
              placeholder="Hledat podle e-mailu, jména prodejce, telefonu nebo lokace..."
              className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-12 pr-12 text-sm font-medium text-slate-950 shadow-2xs outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            >
              <option value="all">Všechny stavy</option>
              <option value="ok">Status: OK</option>
              <option value="not-working">Status: Chyba spojení</option>
              <option value="unknown">Status: Neznámý</option>
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
              className="rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            >
              <option value="all">Všechny platformy</option>
              <option value="bazos">Pouze Bazoš</option>
              <option value="sbazar">Pouze Sbazar</option>
              <option value="facebook">Pouze Facebook</option>
            </select>
          </div>

          <span className="text-xs font-semibold text-slate-500">
            Zobrazeno {filteredUsers.length} z {users.length} prodejců
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          <p className="mt-3 text-xs font-semibold text-slate-500">Načítám seznam prodejců…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-2xs">
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            onClick={() => loadUsers()}
            className="mt-4 rounded-xl bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-800 active:scale-95 transition-all"
          >
            Zkusit znovu
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-2xs">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
            👥
          </div>
          <h3 className="text-base font-bold text-slate-950">Žádní uživatelé</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Pro zadané vyhledávací kritérium nebo filtry nebyl nalezen žádný prodejce.
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Zrušit filtry
          </button>
        </div>
      ) : (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700">Prodejce / Účet</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700">Telefon</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700">Lokalita</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700">Platformy</th>
                  <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-700">Stav</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const sInfo = statusInfo(user.status_cz);
                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-sm text-slate-950 group-hover:text-emerald-700 transition-colors">
                          {user.bazos_name || 'Bez uvedeného jména'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate max-w-[220px]">
                          {user.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">
                        {user.telephone1 ? (
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-3 w-3 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{formatPhoneNumber(user.telephone1)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                        {user.location || user.zipcode ? (
                          <span className="inline-flex items-center gap-1">
                            <span>📍</span>
                            <span>{user.location || ''}{user.location && user.zipcode ? ', ' : ''}{user.zipcode || ''}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.bazos_email && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              <span>🏷️</span>
                              <span>Bazoš</span>
                            </span>
                          )}
                          {user.sbazar_email && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              <span>🛒</span>
                              <span>Sbazar</span>
                            </span>
                          )}
                          {user.facebook_email && (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              <span>📘</span>
                              <span>Facebook</span>
                            </span>
                          )}
                          {!user.bazos_email && !user.sbazar_email && !user.facebook_email && (
                            <span className="text-xs text-slate-400 italic">Nenapojeno</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${sInfo.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sInfo.dot}`} />
                          <span>{sInfo.label}</span>
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs group-hover:bg-slate-900 group-hover:text-white group-hover:border-transparent transition-all duration-200"
                        >
                          <span>Detail</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Detail Modal matching OfferModal design */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <div>
                  <h3 className="text-base font-bold text-slate-950 leading-tight">
                    {selectedUser.bazos_name || 'Profil prodejce'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusInfo(selectedUser.status_cz).badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusInfo(selectedUser.status_cz).dot}`} />
                  <span>{statusInfo(selectedUser.status_cz).label}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Zavřít"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Card: Kontaktní informace */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-2">
                  Kontaktní informace
                </h4>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Hlavní telefon</span>
                  {selectedUser.telephone1 ? (
                    <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {formatPhoneNumber(selectedUser.telephone1)}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Neuveden</span>
                  )}
                </div>

                {selectedUser.telephone2 && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                    <span className="font-semibold text-slate-500">Druhý telefon</span>
                    <span className="font-bold text-slate-900">{formatPhoneNumber(selectedUser.telephone2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">E-mail účtu</span>
                  <span className="font-medium text-slate-900">{selectedUser.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Lokalita a PSČ</span>
                  <span className="font-medium text-slate-900">
                    {selectedUser.location || selectedUser.zipcode
                      ? `${selectedUser.location || ''}${selectedUser.location && selectedUser.zipcode ? ', ' : ''}${selectedUser.zipcode || ''}`
                      : 'Neuvedeno'}
                  </span>
                </div>
              </div>

              {/* Card: Napojené inzertní účty */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-2 text-xs shadow-2xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-2">
                  Napojené inzertní platformy
                </h4>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span>🏷️</span> Bazoš.cz
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedUser.bazos_email || <span className="text-slate-400 italic">Nenapojeno</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span>🛒</span> Sbazar.cz
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedUser.sbazar_email || <span className="text-slate-400 italic">Nenapojeno</span>}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span>📘</span> Facebook Marketplace
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedUser.facebook_email || <span className="text-slate-400 italic">Nenapojeno</span>}
                  </span>
                </div>

                {selectedUser.sbazar_profile && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="font-semibold text-slate-500">Sbazar profil</span>
                    <a
                      href={selectedUser.sbazar_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <span>Otevřít profil prodejce</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Card: Systémové a technické parametry */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 text-[10px] mb-2">
                  Systémové parametry synchronizace
                </h4>

                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                  <span className="font-semibold text-slate-500">Stav CZ / SK</span>
                  <span className="font-medium text-slate-900">
                    CZ: {selectedUser.status_cz || '—'} · SK: {selectedUser.status_sk || '—'}
                  </span>
                </div>

                {selectedUser.tier && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                    <span className="font-semibold text-slate-500">Tarif / Tier</span>
                    <span className="font-bold text-slate-900">{selectedUser.tier}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">ID záznamu</span>
                  <span className="font-mono text-slate-500">#{selectedUser.id}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
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
