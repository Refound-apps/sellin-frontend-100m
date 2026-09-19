'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { User } from '@/lib/types';
import { getUsers } from '@/lib/api';
import { formatPhoneNumber } from './offerStatus';

interface SellerAccountSwitcherProps {
  currentEmail: string | null;
  myEmail: string | null;
  onSelectAccount: (user: User | null, customEmail?: string) => void;
}

export default function SellerAccountSwitcher({
  currentEmail,
  myEmail,
  onSelectAccount,
}: SellerAccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load users once on mount or when opening
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getUsers();
        if (mounted) {
          // Sort users: with bazos_name first, then alphabetically by email
          const sorted = [...data].sort((a, b) => {
            const nameA = a.bazos_name || a.email;
            const nameB = b.bazos_name || b.email;
            return nameA.localeCompare(nameB, 'cs');
          });
          setUsers(sorted);
        }
      } catch (err) {
        console.error('Failed to load accounts for switcher:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Close on outside click
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
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Current active user object if matched
  const activeUser = useMemo(() => {
    if (!currentEmail) return null;
    return (
      users.find(
        (u) =>
          u.email.toLowerCase().trim() === currentEmail.toLowerCase().trim() ||
          (u.sbazar_email && u.sbazar_email.toLowerCase().trim() === currentEmail.toLowerCase().trim()) ||
          (u.bazos_email && u.bazos_email.toLowerCase().trim() === currentEmail.toLowerCase().trim())
      ) || null
    );
  }, [users, currentEmail]);

  // Filtered accounts according to search
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    const digits = q.replace(/\D/g, '');

    return users.filter((u) => {
      const name = (u.bazos_name || '').toLowerCase();
      const email = u.email.toLowerCase();
      const sEmail = (u.sbazar_email || '').toLowerCase();
      const bEmail = (u.bazos_email || '').toLowerCase();
      const phone = (u.telephone1 || '').replace(/\s+/g, '');
      const location = (u.location || '').toLowerCase();

      if (name.includes(q)) return true;
      if (email.includes(q)) return true;
      if (sEmail.includes(q)) return true;
      if (bEmail.includes(q)) return true;
      if (location.includes(q)) return true;
      if (digits && phone.includes(digits)) return true;

      return false;
    });
  }, [users, search]);

  const isImpersonating = Boolean(currentEmail && currentEmail.toLowerCase() !== myEmail?.toLowerCase());

  const handleSelectUser = (user: User) => {
    onSelectAccount(user);
    setIsOpen(false);
    setSearch('');
  };

  const handleResetToMe = () => {
    onSelectAccount(null);
    setIsOpen(false);
    setSearch('');
  };

  const handleApplyCustomEmail = () => {
    const clean = search.trim().toLowerCase();
    if (clean && clean.includes('@')) {
      onSelectAccount(null, clean);
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
            isImpersonating
              ? 'border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100/80 ring-2 ring-amber-400/20'
              : 'border-slate-200/90 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300'
          }`}
          title="Přepnout do zobrazení konkrétního účtu prodejce (pouze administrátor)"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-700 group-hover:scale-105 transition-transform">
            {isImpersonating ? '👁️' : '👤'}
          </span>

          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              {isImpersonating ? 'Zobrazení prodejce' : 'Filtrovat účet'}
            </span>
            <span className="font-extrabold text-slate-900 truncate max-w-[170px] sm:max-w-[220px]">
              {isImpersonating
                ? activeUser?.bazos_name || currentEmail
                : 'Můj účet (admin)'}
            </span>
          </div>

          <svg
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isImpersonating && (
          <button
            type="button"
            onClick={handleResetToMe}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950 shadow-2xs transition-all"
            title="Vrátit se na můj výchozí účet"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 z-50 w-[320px] sm:w-[380px] rounded-2xl border border-slate-200/90 bg-white shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 p-3 bg-slate-50/70">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Přepnout účet prodejce
              </span>
              <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[10px] font-bold">
                Admin nástroj
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Hledat jméno, e-mail nebo telefon..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-7 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-900/10 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick options: My Account */}
          <div className="p-2 border-b border-slate-100 space-y-1">
            <button
              type="button"
              onClick={handleResetToMe}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                !isImpersonating
                  ? 'bg-slate-950 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">👑</span>
                <div>
                  <div className="font-bold">Můj administrátorský účet</div>
                  <div className={`text-[10px] ${!isImpersonating ? 'text-slate-300' : 'text-slate-400'}`}>
                    {myEmail || 'Výchozí přihlášený uživatel'}
                  </div>
                </div>
              </div>
              {!isImpersonating && (
                <span className="text-xs font-bold text-emerald-400">Aktivní</span>
              )}
            </button>
          </div>

          {/* Accounts List */}
          <div className="max-h-[280px] overflow-y-auto p-2 divide-y divide-slate-100/80">
            {loading && users.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                Načítám seznam účtů…
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">Nenalezen žádný odpovídající prodejce.</p>
                {search.includes('@') && (
                  <button
                    type="button"
                    onClick={handleApplyCustomEmail}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    Filtrovat podle zadaného e-mailu &quot;{search.trim()}&quot;
                  </button>
                )}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected =
                  currentEmail &&
                  (user.email.toLowerCase().trim() === currentEmail.toLowerCase().trim() ||
                    (user.sbazar_email && user.sbazar_email.toLowerCase().trim() === currentEmail.toLowerCase().trim()) ||
                    (user.bazos_email && user.bazos_email.toLowerCase().trim() === currentEmail.toLowerCase().trim()));

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors group ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-300/80'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-950 truncate group-hover:text-emerald-700 transition-colors">
                          {user.bazos_name || user.email}
                        </span>
                        {user.bazos_name && (
                          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">
                            {user.email}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                        {user.telephone1 && (
                          <span className="font-semibold text-slate-700">
                            📞 {formatPhoneNumber(user.telephone1)}
                          </span>
                        )}
                        {user.sbazar_email && user.sbazar_email !== user.email && (
                          <span className="truncate max-w-[130px] text-slate-400">
                            Sbazar: {user.sbazar_email}
                          </span>
                        )}
                        {user.location && (
                          <span className="text-slate-400">• {user.location}</span>
                        )}
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="shrink-0 rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold">
                        Vybráno
                      </span>
                    ) : (
                      <span className="shrink-0 text-slate-300 group-hover:text-slate-600 transition-colors">
                        →
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Celkem {users.length} prodejců</span>
            <span>Výběr přepne nabídky na inzeráty daného účtu</span>
          </div>
        </div>
      )}
    </div>
  );
}
