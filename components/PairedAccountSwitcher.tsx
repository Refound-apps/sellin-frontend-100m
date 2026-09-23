'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { User } from '@/lib/types';
import { formatPhoneNumber } from './offerStatus';

interface PairedAccountSwitcherProps {
  mainEmail: string | null;
  pairedAccounts: User[];
  selectedSubaccount: User | null;
  onSelectAccount: (account: User | null) => void;
  isAdmin?: boolean;
}

export default function PairedAccountSwitcher({
  mainEmail,
  pairedAccounts,
  selectedSubaccount,
  onSelectAccount,
  isAdmin = false,
}: PairedAccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter paired accounts by search query
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pairedAccounts;

    const digits = q.replace(/\D/g, '');

    return pairedAccounts.filter((acc) => {
      const name = (acc.bazos_name || '').toLowerCase();
      const email = acc.email.toLowerCase();
      const sbazar = (acc.sbazar_email || '').toLowerCase();
      const bazos = (acc.bazos_email || '').toLowerCase();
      const phone = (acc.telephone1 || '').replace(/\s+/g, '');
      const location = (acc.location || '').toLowerCase();

      if (name.includes(q)) return true;
      if (email.includes(q)) return true;
      if (sbazar.includes(q)) return true;
      if (bazos.includes(q)) return true;
      if (location.includes(q)) return true;
      if (digits && phone.includes(digits)) return true;

      return false;
    });
  }, [pairedAccounts, search]);

  const isSubaccountActive = Boolean(selectedSubaccount);

  const displayName = isSubaccountActive
    ? selectedSubaccount?.bazos_name || selectedSubaccount?.email
    : 'Všechny spárované účty';

  const handleSelectSubaccount = (account: User) => {
    onSelectAccount(account);
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectAll = () => {
    onSelectAccount(null);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
          isSubaccountActive
            ? 'border-emerald-500/80 bg-emerald-50/70 text-slate-950 ring-2 ring-emerald-500/15 hover:bg-emerald-100/70'
            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
        }`}
        title="Přepnout zobrazení mezi spárovanými účty"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-xs transition-colors ${
            isSubaccountActive
              ? 'bg-emerald-200/80 text-emerald-800'
              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
          }`}
        >
          {isSubaccountActive ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </span>

        <span className={`text-xs font-medium ${isSubaccountActive ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
          Účet:
        </span>

        <span className={`font-bold truncate max-w-[130px] sm:max-w-[200px] ${isSubaccountActive ? 'text-slate-950' : 'text-slate-900'}`}>
          {displayName}
        </span>

        {!isSubaccountActive && pairedAccounts.length > 1 && (
          <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
            {pairedAccounts.length}
          </span>
        )}

        {isSubaccountActive && (
          <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Subúčet
          </span>
        )}

        <svg
          className={`h-4 w-4 transition-transform duration-150 ${
            isSubaccountActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
          } ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Reset button when subaccount is active */}
      {isSubaccountActive && (
        <button
          type="button"
          onClick={handleSelectAll}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300 bg-white text-xs font-bold text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 hover:border-emerald-400 shadow-xs transition-all active:scale-95"
          title="Zobrazit všechny inzeráty (resetovat filtr subúčtu)"
        >
          ✕
        </button>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[310px] sm:w-[360px] rounded-2xl border border-slate-200/90 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Přepnout zobrazení inzerátů
            </span>
            {mainEmail && (
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]" title={mainEmail}>
                {mainEmail}
              </span>
            )}
          </div>

          {/* Quick Search (if multiple accounts) */}
          {pairedAccounts.length > 4 && (
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hledat v účtech..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary Option: Main account / All offers across paired accounts */}
          <div className="p-1.5 border-b border-slate-100 bg-slate-50/40">
            <button
              type="button"
              onClick={handleSelectAll}
              className={`w-full flex items-center justify-between gap-2.5 rounded-xl p-2.5 text-left transition-all ${
                !isSubaccountActive
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'hover:bg-slate-100/90 text-slate-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-black ${!isSubaccountActive ? 'text-white' : 'text-slate-950'}`}>
                    Všechny spárované účty
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                      !isSubaccountActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {pairedAccounts.length} {pairedAccounts.length === 1 ? 'účet' : 'účtů'}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 truncate ${!isSubaccountActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  Zobrazit všechny inzeráty napříč spárovanými účty
                </p>
              </div>

              {!isSubaccountActive && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 font-black text-xs">
                  ✓
                </span>
              )}
            </button>
          </div>

          {/* Subaccounts List */}
          <div className="max-h-[280px] overflow-y-auto p-1.5 space-y-1">
            <div className="px-2 pt-1 pb-0.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Samostatné subúčty</span>
              <span>Inzeráty daného účtu</span>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                Nenalezen žádný odpovídající účet.
              </div>
            ) : (
              filteredAccounts.map((account) => {
                const isSelected =
                  selectedSubaccount?.email.toLowerCase().trim() === account.email.toLowerCase().trim();
                const itemDisplayName = account.bazos_name || account.email;
                const phone = account.telephone1 ? formatPhoneNumber(account.telephone1) : null;

                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleSelectSubaccount(account)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl p-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border border-emerald-300 text-slate-950 shadow-2xs font-semibold'
                        : 'border border-transparent hover:border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-bold truncate ${
                            isSelected ? 'text-emerald-950' : 'text-slate-900'
                          }`}
                        >
                          {itemDisplayName}
                        </span>
                        {account.bazos_name && (
                          <span className={`text-[10px] truncate max-w-[130px] ${isSelected ? 'text-emerald-700/80' : 'text-slate-400'}`}>
                            ({account.email})
                          </span>
                        )}
                        {isSelected && (
                          <span className="rounded-full bg-emerald-200/80 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-900 uppercase tracking-wider">
                            Aktivní
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        {phone && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                            <span>📞</span>
                            <span>{phone}</span>
                          </span>
                        )}
                        {account.location && (
                          <span className="inline-flex items-center gap-1">
                            <span>📍</span>
                            <span>{account.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M9.707 3.293a1 1 0 00-1.414 0L5 6.586 3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{pairedAccounts.length} spárovaných účtů</span>
            {isSubaccountActive && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                Všechny inzeráty
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
