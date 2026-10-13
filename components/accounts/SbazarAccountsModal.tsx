'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { User } from '@/lib/types';
import {
  updateCredential,
  getCredential,
  startSbazarLogin,
  confirmSbazarLogin,
  pollSbazarLogin,
  checkSbazarSession,
  cancelSbazarLogin,
} from '@/lib/api';

interface SbazarAccountsModalProps {
  onClose: () => void;
  accounts: User[];
  mainEmail: string;
  onAccountsUpdated: (updatedAccount: User) => void;
}

function buildSbazarForm(account: User, mainEmail: string): Partial<User> {
  return {
    sbazar_email: account.sbazar_email || mainEmail || '',
    sbazar_password: account.sbazar_password || '',
    telephone1: account.telephone1 || '',
    sbazar_profile: account.sbazar_profile || '',
    sbazar_cookie_ds: account.sbazar_cookie_ds || '',
    proxy_ip_sbazar: account.proxy_ip_sbazar || '',
    location: account.location || '',
    zipcode: account.zipcode ? String(account.zipcode) : '',
    status_cz: account.status_cz || 'OK',
  };
}

export default function SbazarAccountsModal({
  onClose,
  accounts,
  mainEmail,
  onAccountsUpdated,
}: SbazarAccountsModalProps) {
  const [selectedId, setSelectedId] = useState<number>(accounts[0]?.id || 0);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const secretsCache = useRef<Map<number, User>>(new Map());
  const loadSeq = useRef(0);

  // Auto-login & 2FA / Session test states
  const [loginLoading, setLoginLoading] = useState(false);
  const [testingSession, setTestingSession] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'ok' | 'expired' | null>(null);
  const [loginStep, setLoginStep] = useState<'idle' | 'sms' | 'app'>('idle');
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedId) || accounts[0] || null;
  }, [accounts, selectedId]);

  const [form, setForm] = useState<Partial<User>>(() =>
    accounts[0] ? buildSbazarForm(accounts[0], mainEmail) : {}
  );

  useEffect(() => {
    if (!currentAccount) return;

    const cached = secretsCache.current.get(currentAccount.id);
    if (cached) {
      setForm(buildSbazarForm({ ...currentAccount, ...cached }, mainEmail));
      setSaveSuccess(false);
      setError(null);
      setFieldErrors({});
      return;
    }

    setForm(buildSbazarForm(currentAccount, mainEmail));
    setSaveSuccess(false);
    setError(null);
    setFieldErrors({});
    setSessionStatus(null);
    setLoginStep('idle');
    setLoginSessionId(null);
    setSmsCode('');
    setLoginSuccessMsg(null);
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    const seq = ++loadSeq.current;
    getCredential(currentAccount.id)
      .then((full) => {
        if (loadSeq.current !== seq) return;
        secretsCache.current.set(full.id, full);
        setForm(buildSbazarForm(full, mainEmail));
        onAccountsUpdated({
          ...currentAccount,
          ...full,
          cookies: {
            has_bazos_bkod: Boolean(full.bazos_bkod?.trim()),
            has_bazos_sk_bkod: Boolean(full.bazos_sk_bkod?.trim()),
            has_sbazar_cookie: Boolean(full.sbazar_cookie_ds?.trim()),
            has_facebook_cookies: Boolean(full.facebook_cuser?.trim() && full.facebook_xs?.trim()),
            has_proxy: Boolean(full.proxy_ip?.trim()),
            has_proxy_sbazar: Boolean(full.proxy_ip_sbazar?.trim()),
          },
        });
      })
      .catch((err: unknown) => {
        if (loadSeq.current !== seq) return;
        console.error('Error loading Sbazar credential secrets:', err);
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst údaje účtu.');
      });
  }, [currentAccount?.id, mainEmail]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const handleStartLogin = async () => {
    if (!currentAccount) return;
    const email = String(form.sbazar_email || '').trim();
    const password = String(form.sbazar_password || '').trim();

    if (!email) {
      setError('Vyplňte prosím Seznam přihlašovací e-mail.');
      return;
    }
    if (!password) {
      setError('Vyplňte prosím heslo k Seznam účtu.');
      return;
    }

    try {
      setLoginLoading(true);
      setError(null);
      setLoginSuccessMsg(null);
      setSessionStatus(null);

      const res = await startSbazarLogin({
        credentialId: currentAccount.id,
        email,
        password,
      });

      if (res.status === 'ok' && res.sbazar_cookie_ds) {
        setForm((prev) => ({ ...prev, sbazar_cookie_ds: res.sbazar_cookie_ds }));
        setSessionStatus('ok');
        setLoginSuccessMsg('Přihlášení úspěšné! Session cookie (DS) byla získána a uložena.');
        // Update local credential
        const updatedUser: User = {
          ...currentAccount,
          sbazar_cookie_ds: res.sbazar_cookie_ds,
          status_cz: 'OK',
          cookies: {
            has_bazos_bkod: Boolean(currentAccount.cookies?.has_bazos_bkod),
            has_bazos_sk_bkod: Boolean(currentAccount.cookies?.has_bazos_sk_bkod),
            has_sbazar_cookie: true,
            has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
            has_proxy: Boolean(currentAccount.cookies?.has_proxy),
            has_proxy_sbazar: Boolean(currentAccount.cookies?.has_proxy_sbazar),
          },
        };
        secretsCache.current.set(updatedUser.id, updatedUser);
        onAccountsUpdated(updatedUser);
      } else if (res.status === 'sms_required' && res.sessionId) {
        setLoginSessionId(res.sessionId);
        setLoginStep('sms');
      } else if (res.status === 'app_confirm_required' && res.sessionId) {
        setLoginSessionId(res.sessionId);
        setLoginStep('app');
        // Start polling every 3s
        pollTimerRef.current = setInterval(async () => {
          try {
            const pollRes = await pollSbazarLogin(res.sessionId!);
            if (pollRes.status === 'ok' && pollRes.sbazar_cookie_ds) {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              setForm((prev) => ({ ...prev, sbazar_cookie_ds: pollRes.sbazar_cookie_ds }));
              setSessionStatus('ok');
              setLoginStep('idle');
              setLoginSuccessMsg('Přihlášení v aplikaci potvrzeno! Session cookie uložena.');
              const updatedUser: User = {
                ...currentAccount,
                sbazar_cookie_ds: pollRes.sbazar_cookie_ds,
                status_cz: 'OK',
                cookies: {
                  has_bazos_bkod: Boolean(currentAccount.cookies?.has_bazos_bkod),
                  has_bazos_sk_bkod: Boolean(currentAccount.cookies?.has_bazos_sk_bkod),
                  has_sbazar_cookie: true,
                  has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
                  has_proxy: Boolean(currentAccount.cookies?.has_proxy),
                  has_proxy_sbazar: Boolean(currentAccount.cookies?.has_proxy_sbazar),
                },
              };
              secretsCache.current.set(updatedUser.id, updatedUser);
              onAccountsUpdated(updatedUser);
            } else if (pollRes.status === 'error') {
              if (pollTimerRef.current) clearInterval(pollTimerRef.current);
              setError(pollRes.error || 'Přihlášení nebylo v aplikaci schváleno.');
              setLoginStep('idle');
            }
          } catch (e) {}
        }, 3000);
      } else {
        setError(res.error || 'Přihlášení na Sbazar se nezdařilo.');
      }
    } catch (err: any) {
      console.error('Error starting Sbazar login:', err);
      setError(err?.message || 'Chyba při přihlašování na Sbazar.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleConfirmSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSessionId || !smsCode.trim() || !currentAccount) return;

    try {
      setLoginLoading(true);
      setError(null);
      const res = await confirmSbazarLogin({
        sessionId: loginSessionId,
        code: smsCode.trim(),
      });

      if (res.status === 'ok' && res.sbazar_cookie_ds) {
        setForm((prev) => ({ ...prev, sbazar_cookie_ds: res.sbazar_cookie_ds }));
        setSessionStatus('ok');
        setLoginStep('idle');
        setLoginSuccessMsg('SMS kód ověřen! Session cookie (DS) byla uložena.');
        const updatedUser: User = {
          ...currentAccount,
          sbazar_cookie_ds: res.sbazar_cookie_ds,
          status_cz: 'OK',
          cookies: {
            has_bazos_bkod: Boolean(currentAccount.cookies?.has_bazos_bkod),
            has_bazos_sk_bkod: Boolean(currentAccount.cookies?.has_bazos_sk_bkod),
            has_sbazar_cookie: true,
            has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
            has_proxy: Boolean(currentAccount.cookies?.has_proxy),
            has_proxy_sbazar: Boolean(currentAccount.cookies?.has_proxy_sbazar),
          },
        };
        secretsCache.current.set(updatedUser.id, updatedUser);
        onAccountsUpdated(updatedUser);
      } else {
        setError(res.error || 'Neplatný SMS kód.');
      }
    } catch (err: any) {
      setError(err?.message || 'Chyba při ověření SMS kódu.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleTestSession = async () => {
    if (!currentAccount) return;
    const ds = String(form.sbazar_cookie_ds || '').trim();
    if (!ds) {
      setError('Účet nemá nastavenou session cookie (DS). Nejprve se přihlaste.');
      return;
    }

    try {
      setTestingSession(true);
      setError(null);
      setLoginSuccessMsg(null);
      const res = await checkSbazarSession({
        credentialId: currentAccount.id,
        email: form.sbazar_email || currentAccount.email,
        sbazar_cookie_ds: ds,
      });

      if (res.valid) {
        setSessionStatus('ok');
        setLoginSuccessMsg('Session cookie je plně funkční a aktivní na Sbazar.cz!');
      } else {
        setSessionStatus('expired');
        setError(res.error || 'Session cookie již není platná. Přihlaste se znovu.');
      }
    } catch (err: any) {
      setError(err?.message || 'Chyba při testování session.');
    } finally {
      setTestingSession(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((a) => {
      const name = (a.bazos_name || '').toLowerCase();
      const email = a.email.toLowerCase();
      const sEmail = (a.sbazar_email || '').toLowerCase();
      const phone = (a.telephone1 || '').replace(/\s+/g, '');
      return name.includes(q) || email.includes(q) || sEmail.includes(q) || phone.includes(q);
    });
  }, [accounts, search]);

  const validateSbazarForm = (data: Partial<User>): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!String(data.sbazar_email || '').trim()) errs.sbazar_email = 'Povinné';
    if (!String(data.sbazar_password || '').trim()) errs.sbazar_password = 'Povinné';
    if (!String(data.telephone1 || '').trim()) errs.telephone1 = 'Povinné';
    if (!String(data.location || '').trim()) errs.location = 'Povinné';
    const zip = String(data.zipcode ?? '').replace(/\s+/g, '');
    if (!zip) errs.zipcode = 'Povinné';
    else if (!/^\d{5}$/.test(zip)) errs.zipcode = 'Zadejte 5 číslic (např. 30100)';
    return errs;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    const errs = validateSbazarForm(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('Vyplňte všechna povinná pole označená *.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const zipRaw = String(form.zipcode).replace(/\s+/g, '');
      const payload: Partial<User> = {
        ...form,
        zipcode: parseFloat(zipRaw),
      };

      const updated = await updateCredential(currentAccount.id, payload);
      const withSecrets: User = {
        ...currentAccount,
        ...updated,
        sbazar_password: String(form.sbazar_password || updated.sbazar_password || ''),
        sbazar_cookie_ds: String(form.sbazar_cookie_ds || updated.sbazar_cookie_ds || ''),
        cookies: {
          has_bazos_bkod: Boolean(currentAccount.cookies?.has_bazos_bkod),
          has_bazos_sk_bkod: Boolean(currentAccount.cookies?.has_bazos_sk_bkod),
          has_sbazar_cookie: Boolean(String(form.sbazar_cookie_ds || '').trim()),
          has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
          has_proxy: Boolean(currentAccount.proxy_ip?.trim() || currentAccount.cookies?.has_proxy),
          has_proxy_sbazar: Boolean(
            String(form.proxy_ip_sbazar || currentAccount.proxy_ip_sbazar || '').trim()
          ),
        },
      };
      secretsCache.current.set(withSecrets.id, withSecrets);
      onAccountsUpdated(withSecrets);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving Sbazar credentials:', err);
      setError(err?.message || 'Uložení údajů Sbazaru se nezdařilo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-red-500/10 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DC2626] shadow-2xs p-2 text-white font-black text-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-950">
                  Sbazar.cz – Správa napojených účtů
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200/80 px-2 py-0.5 text-xs font-bold text-red-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  {accounts.length} subúčtů spárováno
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Přihlašovací Seznam účty, profil a autorizační cookies pro <strong className="text-slate-800">{mainEmail}</strong>
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

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Column: Accounts list */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col min-h-0 bg-slate-50/50">
            <div className="p-3 border-b border-slate-200/70">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Hledat podle e-mailu, jména..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-red-500 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500 px-1">
                Centrální Seznam login: <strong>{mainEmail}</strong>
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredAccounts.map((acc) => {
                const isSelected = acc.id === currentAccount?.id;
                const displayName = acc.bazos_name || acc.email.split('@')[0];

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      if (acc.id === selectedId) return;
                      setSelectedId(acc.id);
                    }}
                    className={`w-full text-left rounded-2xl p-3 transition-all border ${
                      isSelected
                        ? 'border-red-400 bg-red-50/80 shadow-xs ring-1 ring-red-300'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {displayName}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate font-mono">
                          {acc.email}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-md bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800">
                        Sbazar
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{acc.telephone1 || 'Bez telefonu'}</span>
                      <div className="flex items-center gap-1.5">
                        {acc.sbazar_cookie_ds || acc.cookies?.has_sbazar_cookie ? (
                          <span className="text-emerald-600 font-bold">Session ✓</span>
                        ) : (
                          <span className="text-amber-500 font-medium">Bez session</span>
                        )}
                        <span>{acc.sbazar_profile ? 'Profil ✓' : 'Bez profilu'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Account Detail */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col min-h-0 bg-white overflow-y-auto">
            {currentAccount ? (
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-950">
                        {currentAccount.bazos_name || currentAccount.email}
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

                {/* Section 1: Seznam Login Credentials */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Přihlašovací údaje Seznam.cz
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Seznam přihlašovací e-mail <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.sbazar_email || ''}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, sbazar_email: e.target.value }));
                          setFieldErrors((p) => ({ ...p, sbazar_email: '' }));
                        }}
                        placeholder="duplux@seznam.cz"
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none ${
                          fieldErrors.sbazar_email ? 'border-rose-400' : 'border-slate-200'
                        }`}
                      />
                      {fieldErrors.sbazar_email && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.sbazar_email}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Heslo k Seznam účtu <span className="text-rose-500">*</span>
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
                        required
                        value={form.sbazar_password || ''}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, sbazar_password: e.target.value }));
                          setFieldErrors((p) => ({ ...p, sbazar_password: '' }));
                        }}
                        placeholder="Heslo k Seznam účtu..."
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none ${
                          fieldErrors.sbazar_password ? 'border-rose-400' : 'border-slate-200'
                        }`}
                      />
                      {fieldErrors.sbazar_password && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.sbazar_password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefon pro autorizaci <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.telephone1 || ''}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, telephone1: e.target.value }));
                          setFieldErrors((p) => ({ ...p, telephone1: '' }));
                        }}
                        placeholder="+420 777 000 111"
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none ${
                          fieldErrors.telephone1 ? 'border-rose-400' : 'border-slate-200'
                        }`}
                      />
                      {fieldErrors.telephone1 && (
                        <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.telephone1}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Veřejný profil na Sbazaru
                      </label>
                      <input
                        type="url"
                        value={form.sbazar_profile || ''}
                        onChange={(e) => setForm((p) => ({ ...p, sbazar_profile: e.target.value }))}
                        placeholder="https://www.sbazar.cz/duplux"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Session Cookie DS, Login & Proxy */}
                <div className="rounded-2xl border border-red-200/90 bg-red-50/40 p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold">
                        🔑
                      </span>
                      <div>
                        <h5 className="text-xs font-black text-red-950">
                          Seznam Session Cookie (DS) & Automatické přihlášení
                        </h5>
                        <p className="text-[11px] text-red-900/80">
                          Umožňuje okamžité a bezpečné vkládání inzerátů bez ručního opisování cookies.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleStartLogin}
                        disabled={loginLoading || testingSession}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-xs disabled:opacity-50"
                      >
                        {loginLoading ? (
                          <>
                            <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Přihlašuji…
                          </>
                        ) : (
                          <>🚀 Přihlásit se na Seznam</>
                        )}
                      </button>

                      {form.sbazar_cookie_ds && (
                        <button
                          type="button"
                          onClick={handleTestSession}
                          disabled={testingSession || loginLoading}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          {testingSession ? (
                            <>
                              <span className="h-3 w-3 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                              Testuji…
                            </>
                          ) : (
                            <>⚡ Testovat spojení</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {loginSuccessMsg && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <span>✓</span>
                      <span>{loginSuccessMsg}</span>
                    </div>
                  )}

                  {/* 2FA SMS Modal / Box */}
                  {loginStep === 'sms' && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">
                          📱 Dvoufázové ověření – Zadejte SMS kód:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (loginSessionId) cancelSbazarLogin(loginSessionId);
                            setLoginStep('idle');
                          }}
                          className="text-[11px] text-amber-700 hover:underline"
                        >
                          Zrušit
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                          placeholder="Např. 123456"
                          className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-amber-600"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmSms}
                          disabled={loginLoading || !smsCode.trim()}
                          className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                        >
                          {loginLoading ? 'Ověřuji…' : 'Ověřit kód'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2FA App Modal / Box */}
                  {loginStep === 'app' && (
                    <div className="rounded-xl border border-blue-300 bg-blue-50 p-3 space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                          <span className="text-xs font-bold text-blue-900">
                            Potvrďte prosím přihlášení v mobilní aplikaci Seznam...
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                            if (loginSessionId) cancelSbazarLogin(loginSessionId);
                            setLoginStep('idle');
                          }}
                          className="text-[11px] text-blue-700 hover:underline"
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-red-950">
                          Seznam Cookie DS
                        </label>
                        {sessionStatus === 'ok' && (
                          <span className="text-[11px] font-bold text-emerald-600">
                            ✓ Aktivní relace
                          </span>
                        )}
                        {sessionStatus === 'expired' && (
                          <span className="text-[11px] font-bold text-rose-600">
                            ✕ Neplatná relace
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={form.sbazar_cookie_ds || ''}
                        onChange={(e) => setForm((p) => ({ ...p, sbazar_cookie_ds: e.target.value }))}
                        placeholder="Automaticky získáno po kliknutí na 'Přihlásit se na Seznam'..."
                        className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 font-mono text-[11px] text-slate-900 focus:border-red-600 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-red-950 mb-1">
                          Vyhrazená Proxy IP pro Sbazar
                        </label>
                        <input
                          type="text"
                          value={form.proxy_ip_sbazar || ''}
                          onChange={(e) => setForm((p) => ({ ...p, proxy_ip_sbazar: e.target.value }))}
                          placeholder="např. 62.241.62.153"
                          className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-900 focus:border-red-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-red-950 mb-1">
                          Stav účtu na Sbazaru
                        </label>
                        <select
                          value={form.status_cz || 'OK'}
                          onChange={(e) => setForm((p) => ({ ...p, status_cz: e.target.value }))}
                          className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-red-600 outline-none"
                        >
                          <option value="OK">OK (Aktivní)</option>
                          <option value="NEAKTIVNI">Neaktivní</option>
                          <option value="BLOCKED">BLOKOVÁN</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lokalita pro Sbazar <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.location || ''}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, location: e.target.value }));
                        setFieldErrors((p) => ({ ...p, location: '' }));
                      }}
                      placeholder="Praha, Plzeň, Brno..."
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none ${
                        fieldErrors.location ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.location && (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.location}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PSČ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={form.zipcode || ''}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, zipcode: e.target.value }));
                        setFieldErrors((p) => ({ ...p, zipcode: '' }));
                      }}
                      placeholder="30100"
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-red-500 outline-none ${
                        fieldErrors.zipcode ? 'border-rose-400' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.zipcode ? (
                      <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.zipcode}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">5 číslic bez mezery</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                      ✓ Údaje Sbazaru úspěšně uloženy
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Ukládám změny…' : 'Uložit údaje Sbazaru'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
