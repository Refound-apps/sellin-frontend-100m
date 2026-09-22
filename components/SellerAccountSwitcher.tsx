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

  const isFiltered = Boolean(currentEmail && currentEmail.toLowerCase() !== myEmail?.toLowerCase());

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

  const displayName = isFiltered
    ? activeUser?.bazos_name || currentEmail
    : 'Můj účet (admin)';

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
          isFiltered
            ? 'border-indigo-300 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/15 hover:bg-indigo-100/80'
            : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
        }`}
        title="Filtrovat nabídku podle účtu prodejce"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isFiltered
              ? 'bg-indigo-200/80 text-indigo-800'
              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </span>

        <span className={`text-xs font-medium ${isFiltered ? 'text-indigo-600 font-semibold' : 'text-slate-500'}`}>
          Účet:
        </span>
        <span
          className={`font-bold truncate max-w-[130px] sm:max-w-[200px] ${
            isFiltered ? 'text-indigo-950' : 'text-slate-900'
          }`}
        >
          {displayName}
        </span>
        <svg
          className={`h-4 w-4 transition-transform duration-150 ${
            isFiltered ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
          } ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isFiltered && (
        <button
          type="button"
          onClick={handleResetToMe}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-white text-xs font-bold text-indigo-600 hover:text-indigo-950 hover:bg-indigo-50 hover:border-indigo-300 shadow-xs transition-all active:scale-95"
          title="Zrušit filtr účtu (vrátit na můj účet)"
        >
          ✕
        </button>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[300px] sm:w-[340px] rounded-2xl border border-slate-200/90 bg-white shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
          {/* Search Input */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/60">
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
                placeholder="Hledat prodejce..."
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
          <div className="p-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={handleResetToMe}
              className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                !isFiltered
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0">
                <div className={`font-bold ${!isFiltered ? 'text-white' : 'text-slate-900'}`}>
                  Můj účet (admin)
                </div>
                <div className={`text-[10px] truncate ${!isFiltered ? 'text-slate-300' : 'text-slate-400'}`}>
                  {myEmail || 'Výchozí administrátorský účet'}
                </div>
              </div>
              {!isFiltered && (
                <span className="text-white font-bold text-xs shrink-0">✓</span>
              )}
            </button>
          </div>

          {/* Accounts List */}
          <div className="max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
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
                    className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Filtrovat &quot;{search.trim()}&quot;
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

                const itemDisplayName = user.bazos_name || user.email;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200/90 text-indigo-950 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className={`font-semibold truncate ${
                            isSelected ? 'text-indigo-950 font-bold' : 'text-slate-900'
                          }`}
                        >
                          {itemDisplayName}
                        </span>
                        {user.bazos_name && (
                          <span
                            className={`text-[10px] font-normal truncate max-w-[120px] ${
                              isSelected ? 'text-indigo-600/80' : 'text-slate-400'
                            }`}
                          >
                            {user.email}
                          </span>
                        )}
                      </div>

                      {user.telephone1 && (
                        <div
                          className={`mt-0.5 text-[10px] truncate ${
                            isSelected ? 'text-indigo-700/80 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {formatPhoneNumber(user.telephone1)}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="shrink-0 text-indigo-600 font-bold text-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>{users.length} prodejců</span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetToMe}
                className="text-indigo-600 hover:text-indigo-900 font-semibold"
              >
                Resetovat filtr
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
