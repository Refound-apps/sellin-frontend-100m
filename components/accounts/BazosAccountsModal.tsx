'use client';

import { useState, useMemo } from 'react';
import { User } from '@/lib/types';
import { updateCredential, createCredential } from '@/lib/api';

interface BazosAccountsModalProps {
  onClose: () => void;
  accounts: User[];
  mainEmail: string;
  onAccountsUpdated: (updatedAccount: User) => void;
  onAccountCreated?: (newAccount: User) => void;
}

export default function BazosAccountsModal({
  onClose,
  accounts,
  mainEmail,
  onAccountsUpdated,
  onAccountCreated,
}: BazosAccountsModalProps) {
  const [selectedId, setSelectedId] = useState<number>(accounts[0]?.id || 0);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New account draft
  const [newDraft, setNewDraft] = useState({
    email: '',
    bazos_name: '',
    bazos_email: '',
    bazos_password: '',
    bazos_bkod: '',
    bazos_sk_bkod: '',
    telephone1: '',
    location: 'Praha',
    zipcode: '110 00',
    bazos_rewrite: true,
    bazos_top_max: '0',
    status_cz: 'OK',
  });

  // Current selected account
  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedId) || accounts[0] || null;
  }, [accounts, selectedId]);

  // Editable form state for current account
  const [form, setForm] = useState<Partial<User>>({});

  // Sync form when selected account changes
  useMemo(() => {
    if (currentAccount) {
      setForm({
        bazos_name: currentAccount.bazos_name || '',
        bazos_email: currentAccount.bazos_email || currentAccount.email || '',
        bazos_password: currentAccount.bazos_password || '',
        bazos_bkod: currentAccount.bazos_bkod || '',
        bazos_sk_bkod: currentAccount.bazos_sk_bkod || '',
        telephone1: currentAccount.telephone1 || '',
        location: currentAccount.location || '',
        zipcode: currentAccount.zipcode ? String(currentAccount.zipcode) : '',
        zipcode_sk: currentAccount.zipcode_sk || '',
        bazos_rewrite: currentAccount.bazos_rewrite ?? true,
        bazos_top_max: currentAccount.bazos_top_max ?? 0,
        status_cz: currentAccount.status_cz || 'OK',
        status_sk: currentAccount.status_sk || '',
      });
      setSaveSuccess(false);
      setError(null);
    }
  }, [currentAccount?.id]);

  // Filter accounts by search
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const name = (a.bazos_name || '').toLowerCase();
      const email = a.email.toLowerCase();
      const bEmail = (a.bazos_email || '').toLowerCase();
      const phone = (a.telephone1 || '').replace(/\s+/g, '');
      const bkod = (a.bazos_bkod || '').toLowerCase();
      const loc = (a.location || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        bEmail.includes(q) ||
        phone.includes(q.replace(/\s+/g, '')) ||
        bkod.includes(q) ||
        loc.includes(q)
      );
    });
  }, [accounts, search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const updated = await updateCredential(currentAccount.id, form);
      onAccountsUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving Bazos credentials:', err);
      setError(err?.message || 'Uložení změn se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDraft.email.trim()) {
      setError('Zadejte prosím unikátní e-mail účtu.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const created = await createCredential({
        ...newDraft,
        sbazar_email: mainEmail,
        zipcode: newDraft.zipcode ? parseFloat(newDraft.zipcode.replace(/\s+/g, '')) : null,
        bazos_top_max: newDraft.bazos_top_max ? parseFloat(newDraft.bazos_top_max) : 0,
      });

      if (onAccountCreated) {
        onAccountCreated(created);
      }
      onAccountsUpdated(created);
      setSelectedId(created.id);
      setIsAddingNew(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error creating new Bazos subaccount:', err);
      setError(err?.message || 'Vytvoření nového účtu se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-amber-500/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF6ED] border border-amber-200 shadow-2xs p-1">
              <svg viewBox="0 0 74 56" className="w-full h-full" fill="none">
                <path
                  fill="#FF6600"
                  d="M49.15,42.33h6.05c-1.9,3.86-4.8,6.89-8.72,9.08c-4.49,2.51-9.97,3.77-16.43,3.77c-6.25,0-11.65-1.06-16.2-3.18c-4.55-2.12-7.93-5.25-10.15-9.39c-2.22-4.14-3.33-8.64-3.33-13.52c0-5.35,1.26-10.33,3.78-14.94c2.52-4.61,5.97-8.08,10.34-10.39c4.38-2.31,9.38-3.47,15-3.47c4.77,0,9.02,0.93,12.73,2.8c3.71,1.87,6.55,4.52,8.51,7.95c1.96,3.44,2.94,7.19,2.94,11.26c0,4.85-1.49,9.24-4.46,13.16c-3.73,4.95-8.52,7.42-14.35,7.42c-1.57,0-2.76-0.28-3.55-0.83c-0.8-0.55-1.33-1.36-1.59-2.43c-2.24,2.17-4.81,3.25-7.73,3.25c-3.15,0-5.75-1.09-7.83-3.27c-2.07-2.18-3.11-5.08-3.11-8.69c0-4.47,1.25-8.55,3.75-12.25c3.03-4.49,6.92-6.74,11.65-6.74c3.37,0,5.86,1.29,7.47,3.88l0.71-3.17h7.5l-4.29,20.47c-0.27,1.29-0.4,2.13-0.4,2.51c0,0.48,0.11,0.83,0.33,1.07c0.22,0.24,0.48,0.36,0.78,0.36c0.91,0,2.08-0.55,3.52-1.66c1.93-1.45,3.5-3.39,4.69-5.82c1.19-2.44,1.79-4.96,1.79-7.56c0-4.68-1.69-8.6-5.06-11.75c-3.37-3.15-8.08-4.72-14.12-4.72c-5.13,0-9.49,1.05-13.06,3.15c-3.57,2.1-6.26,5.06-8.07,8.88c-1.81,3.82-2.71,7.79-2.71,11.92c0,4.02,1.01,7.67,3.03,10.96c2.02,3.29,4.85,5.7,8.5,7.21c3.65,1.51,7.82,2.27,12.52,2.27c4.53,0,8.42-0.63,11.68-1.9C44.54,46.76,47.16,44.86,49.15,42.33z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  Bazoš.cz / SK – Správa napojených účtů
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-bold text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {accounts.length} subúčtů spárováno
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Přihlašovací údaje, ověřovací B-kódy a nastavení synchronizace pro uživatele <strong className="text-slate-800">{mainEmail}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Left column accounts list + Right column account detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Column: Subaccounts list */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col min-h-0 bg-slate-50/50">
            {/* Search and Add */}
            <div className="p-3 border-b border-slate-200/70 space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Hledat podle jména, B-kódu, tel..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-2xs"
                  title="Přidat další Bazoš subúčet"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">Nový</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                <span>Nalezeno: <strong>{filteredAccounts.length}</strong> účtů</span>
                <span>Kliknutím upravíte údaje</span>
              </div>
            </div>

            {/* Account items scrollable */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredAccounts.map((acc) => {
                const isSelected = !isAddingNew && acc.id === currentAccount?.id;
                const bkod = acc.bazos_bkod?.trim();
                const displayName = acc.bazos_name || acc.email.split('@')[0];
                const isBlocked = acc.status_cz === 'BLOCKED';

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setSelectedId(acc.id);
                    }}
                    className={`w-full text-left rounded-2xl p-3 transition-all border ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/80 shadow-xs ring-1 ring-amber-300'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {displayName}
                          </span>
                          {isBlocked && (
                            <span className="rounded-md bg-rose-100 px-1.5 py-0.2 text-[9px] font-bold text-rose-700">
                              BLOKOVÁN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate font-mono">
                          {acc.email}
                        </p>
                      </div>

                      {/* B-kod badge */}
                      {bkod ? (
                        <span className="shrink-0 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                          {bkod}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Bez B-kódu
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{acc.telephone1 || 'Bez telefonu'}</span>
                      <span>{acc.location ? `${acc.location}` : 'ČR'}</span>
                    </div>
                  </button>
                );
              })}

              {filteredAccounts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Žádný spárovaný účet neodpovídá hledání.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Account Edit Form */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col min-h-0 bg-white overflow-y-auto">
            {isAddingNew ? (
              /* Create New Subaccount Form */
              <form onSubmit={handleCreateNewAccount} className="p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Přidat nový Bazoš subúčet
                    </h4>
                    <p className="text-xs text-slate-500">
                      Vytvoří nový účet automaticky spárovaný s {mainEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Zrušit
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Identifikátor účtu / E-mail *
                    </label>
                    <input
                      type="email"
                      required
                      value={newDraft.email}
                      onChange={(e) => setNewDraft((p) => ({ ...p, email: e.target.value }))}
                      placeholder="např. novy-prodej@seznam.cz"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Jméno inzerenta na Bazoši
                    </label>
                    <input
                      type="text"
                      value={newDraft.bazos_name}
                      onChange={(e) => setNewDraft((p) => ({ ...p, bazos_name: e.target.value }))}
                      placeholder="např. Pneu Servis Plzeň"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bazoš B-kód (pro ČR)
                    </label>
                    <input
                      type="text"
                      value={newDraft.bazos_bkod}
                      onChange={(e) => setNewDraft((p) => ({ ...p, bazos_bkod: e.target.value.toUpperCase() }))}
                      placeholder="např. LK5994TGJM"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold focus:border-amber-500 outline-none text-amber-900 bg-amber-50/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefon pro SMS
                    </label>
                    <input
                      type="tel"
                      value={newDraft.telephone1}
                      onChange={(e) => setNewDraft((p) => ({ ...p, telephone1: e.target.value }))}
                      placeholder="+420 777 000 111"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-xs"
                  >
                    {saving ? 'Ukládám nový účet…' : '+ Vytvořit a napojit subúčet'}
                  </button>
                </div>
              </form>
            ) : currentAccount ? (
              /* Edit Selected Subaccount Form */
              <form onSubmit={handleSave} className="p-6 space-y-6">
                {/* Header of selected account */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-950">
                        {form.bazos_name || currentAccount.email}
                      </h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600 font-bold">
                        ID: {currentAccount.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      {currentAccount.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 animate-in fade-in">
                        ✓ Uloženo do databáze
                      </span>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                    >
                      {saving ? 'Ukládám…' : 'Uložit změny'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-semibold">
                    {error}
                  </div>
                )}

                {/* Section 1: Bazos Credentials */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Přihlašovací údaje k Bazoši
                    </h5>
                    <span className="text-[11px] text-slate-400">
                      Používá se pro přihlášení a správu inzerátů
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Jméno prodejce na Bazoši
                      </label>
                      <input
                        type="text"
                        value={form.bazos_name || ''}
                        onChange={(e) => setForm((p) => ({ ...p, bazos_name: e.target.value }))}
                        placeholder="např. Vašek nebo Disky a Pneu"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bazoš přihlašovací e-mail
                      </label>
                      <input
                        type="email"
                        value={form.bazos_email || ''}
                        onChange={(e) => setForm((p) => ({ ...p, bazos_email: e.target.value }))}
                        placeholder="vas@email.cz"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Bazoš heslo
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                        >
                          {showPassword ? 'Skrýt' : 'Zobrazit heslo'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.bazos_password || ''}
                        onChange={(e) => setForm((p) => ({ ...p, bazos_password: e.target.value }))}
                        placeholder="Heslo k Bazoš účtu..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefon pro autorizaci (SMS)
                      </label>
                      <input
                        type="tel"
                        value={form.telephone1 || ''}
                        onChange={(e) => setForm((p) => ({ ...p, telephone1: e.target.value }))}
                        placeholder="+420 777 000 111"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: B-kódy (Critical for fast listing) */}
                <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      B
                    </span>
                    <h5 className="text-xs font-black text-amber-950">
                      Ověřovací B-kódy pro okamžité vystavení bez SMS
                    </h5>
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    B-kód je stálé heslo generované Bazošem pro autorizované vkládání a obnovu inzerátů bez nutnosti potvrzování každého inzerátu přes SMS.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">
                        B-kód pro ČR (Bazoš.cz)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.bazos_bkod || ''}
                          onChange={(e) => setForm((p) => ({ ...p, bazos_bkod: e.target.value.toUpperCase() }))}
                          placeholder="např. LK5994TGJM"
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-950 focus:border-amber-600 outline-none"
                        />
                        {form.bazos_bkod && (
                          <button
                            type="button"
                            onClick={() => {
                              if (navigator?.clipboard) {
                                navigator.clipboard.writeText(form.bazos_bkod || '');
                              }
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 hover:text-amber-950"
                            title="Zkopírovat B-kód"
                          >
                            Kopírovat
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-950 mb-1">
                        B-kód pro Slovensko (Bazoš.sk)
                      </label>
                      <input
                        type="text"
                        value={form.bazos_sk_bkod || ''}
                        onChange={(e) => setForm((p) => ({ ...p, bazos_sk_bkod: e.target.value.toUpperCase() }))}
                        placeholder="B-kód pro SK inzerci (nepovinné)"
                        className="w-full rounded-xl border border-amber-300/80 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-950 focus:border-amber-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Location and Automation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Výchozí město / Lokalita
                    </label>
                    <input
                      type="text"
                      value={form.location || ''}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Praha, Plzeň, Brno..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Výchozí PSČ (ČR)
                    </label>
                    <input
                      type="text"
                      value={form.zipcode || ''}
                      onChange={(e) => setForm((p) => ({ ...p, zipcode: e.target.value }))}
                      placeholder="např. 110 00 nebo 301 00"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Automation Switches */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Automatizace & Stavy
                  </h5>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Automatické obnovování / přepis (Auto-renew)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Před expirací (60 dní) inzerát automaticky obnovit na první pozice
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(form.bazos_rewrite)}
                      onChange={(e) => setForm((p) => ({ ...p, bazos_rewrite: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Limit pro automatické TOPování (Kč / měsíc)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Nastavte 0 pro bezplatnou inzerci bez placeného TOPování
                      </p>
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={form.bazos_top_max ?? 0}
                        onChange={(e) => setForm((p) => ({ ...p, bazos_top_max: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-right text-slate-900 focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                      ✓ Údaje úspěšně uloženy
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Ukládám změny…' : 'Uložit údaje subúčtu'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-400">
                Vyberte účet ze seznamu vlevo k úpravě.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
