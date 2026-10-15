'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import {
  updateCredential,
  createCredential,
  getCredential,
  checkBazosVerificationStatus,
  startBazosVerification,
  confirmBazosVerification,
} from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import BazosVerificationModal from './BazosVerificationModal';

interface BazosAccountsModalProps {
  onClose: () => void;
  accounts: User[];
  mainEmail: string;
  onAccountsUpdated: (updatedAccount: User) => void;
  onAccountCreated?: (newAccount: User) => void;
}

function hasBazosBkod(account?: User | null): boolean {
  if (!account) return false;
  return Boolean(account.bazos_bkod?.trim() || account.cookies?.has_bazos_bkod);
}

function normalizeCzPhone(input: string): string {
  const clean = input.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (!clean) return '';
  if (clean.startsWith('+')) return clean;
  if (clean.startsWith('420') && clean.length === 12) return `+${clean}`;
  if (clean.length === 9) return `+420${clean}`;
  return clean;
}

function buildBazosForm(account: User): Partial<User> {
  return {
    bazos_name: account.bazos_name || '',
    bazos_email: account.bazos_email || account.email || '',
    bazos_password: account.bazos_password || '',
    bazos_bkod: account.bazos_bkod || '',
    bazos_sk_bkod: account.bazos_sk_bkod || '',
    telephone1: account.telephone1 || '',
    location: account.location || '',
    zipcode: account.zipcode ? String(account.zipcode) : '',
    zipcode_sk: account.zipcode_sk || '',
    bazos_rewrite: account.bazos_rewrite ?? true,
    bazos_top_max: account.bazos_top_max ?? 0,
    status_cz: account.status_cz || 'OK',
    status_sk: account.status_sk || '',
  };
}

export default function BazosAccountsModal({
  onClose,
  accounts,
  mainEmail,
  onAccountsUpdated,
  onAccountCreated,
}: BazosAccountsModalProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number>(accounts[0]?.id || 0);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSecrets, setLoadingSecrets] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [checkStatusMsg, setCheckStatusMsg] = useState<string | null>(null);
  const secretsCache = useRef<Map<number, User>>(new Map());
  const loadSeq = useRef(0);

  const currentAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedId) || accounts[0] || null;
  }, [accounts, selectedId]);

  const accountIsVerified = useMemo(() => {
    return hasBazosBkod(currentAccount);
  }, [currentAccount]);

  // View modes:
  // 'wizard'   = Super easy 3-step setup (Phone -> SMS Code -> Success & Create Offer)
  // 'overview' = Active account summary with one-click actions
  // 'advanced' = Full technical subaccounts list & all settings
  const [viewMode, setViewMode] = useState<'wizard' | 'overview' | 'advanced'>(() => {
    return accountIsVerified ? 'overview' : 'wizard';
  });

  // Easy Wizard state
  const [wizardStep, setWizardStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [wizardPhone, setWizardPhone] = useState(
    currentAccount?.telephone1 || ''
  );
  const [wizardName, setWizardName] = useState(
    currentAccount?.bazos_name || ''
  );
  const [wizardLocation, setWizardLocation] = useState(
    currentAccount?.location || 'Praha'
  );
  const [wizardCode, setWizardCode] = useState('');
  const [wizardSessionId, setWizardSessionId] = useState<string | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Sync wizard phone/name when selected account changes
  useEffect(() => {
    if (currentAccount) {
      if (currentAccount.telephone1 && !wizardPhone) {
        setWizardPhone(currentAccount.telephone1);
      }
      if (currentAccount.bazos_name && !wizardName) {
        setWizardName(currentAccount.bazos_name);
      }
      if (currentAccount.location && wizardLocation === 'Praha') {
        setWizardLocation(currentAccount.location);
      }
    }
  }, [currentAccount]);

  const [form, setForm] = useState<Partial<User>>(() =>
    accounts[0] ? buildBazosForm(accounts[0]) : {}
  );

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

  // List API redacts secrets — load full credential for the selected account
  useEffect(() => {
    if (!currentAccount || isAddingNew) return;

    const cached = secretsCache.current.get(currentAccount.id);
    if (cached) {
      setForm(buildBazosForm({ ...currentAccount, ...cached }));
      setSaveSuccess(false);
      setError(null);
      setFieldErrors({});
      return;
    }

    setForm(buildBazosForm(currentAccount));
    setSaveSuccess(false);
    setError(null);
    setFieldErrors({});

    const seq = ++loadSeq.current;
    setLoadingSecrets(true);
    getCredential(currentAccount.id)
      .then((full) => {
        if (loadSeq.current !== seq) return;
        secretsCache.current.set(full.id, full);
        setForm(buildBazosForm(full));
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
        console.error('Error loading credential secrets:', err);
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst B-kódy účtu.');
      })
      .finally(() => {
        if (loadSeq.current === seq) setLoadingSecrets(false);
      });
  }, [currentAccount?.id, isAddingNew]);

  // Filter accounts by search for advanced mode
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

  // --- EASY WIZARD HANDLERS ---
  const handleWizardStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeCzPhone(wizardPhone);
    const digitsOnly = normalizedPhone.replace(/\D/g, '');

    if (!normalizedPhone || digitsOnly.length < 9) {
      setWizardError('Zadejte prosím platné české nebo slovenské telefonní číslo (např. 777 123 456).');
      return;
    }

    setWizardLoading(true);
    setWizardError(null);

    try {
      let targetAccount = currentAccount;

      // Pokud uživatel ještě nemá záznam v credential_pg, vytvoříme ho rovnou
      if (!targetAccount) {
        const created = await createCredential({
          email: mainEmail,
          bazos_email: mainEmail,
          bazos_name: wizardName.trim() || mainEmail.split('@')[0],
          telephone1: normalizedPhone,
          location: wizardLocation.trim() || 'Praha',
          zipcode: 11000,
          status_cz: 'OK',
          bazos_rewrite: true,
          bazos_top_max: 0,
        });
        targetAccount = created;
        setSelectedId(created.id);
        if (onAccountCreated) {
          onAccountCreated(created);
        }
        onAccountsUpdated(created);
      } else {
        // Aktualizujeme telefon a jméno v DB
        const updated = await updateCredential(targetAccount.id, {
          telephone1: normalizedPhone,
          bazos_name: wizardName.trim() || targetAccount.bazos_name || mainEmail.split('@')[0],
          location: wizardLocation.trim() || targetAccount.location || 'Praha',
        });
        targetAccount = { ...targetAccount, ...updated };
        onAccountsUpdated(targetAccount);
      }

      // Spustíme ověření na Bazoši
      const res = await startBazosVerification({
        phone: normalizedPhone,
        credentialId: targetAccount?.id,
        email: targetAccount?.email || mainEmail,
      });

      if (res.status === 'already_verified' && res.bkod) {
        handleVerificationSuccess(res.bkod);
        setWizardStep('success');
        return;
      }

      if (res.sessionId) {
        setWizardSessionId(res.sessionId);
        setWizardStep('code');
      } else {
        throw new Error(res.error || 'Bazoš neodeslal potvrzovací SMS. Zkontrolujte prosím telefonní číslo.');
      }
    } catch (err: any) {
      console.error('Wizard start verification error:', err);
      setWizardError(err?.message || 'Chyba při zahájení ověření. Zkontrolujte prosím telefonní číslo.');
    } finally {
      setWizardLoading(false);
    }
  };

  const handleWizardConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardSessionId) {
      setWizardError('Platnost ověření vypršela. Zkuste to prosím znovu od prvního kroku.');
      setWizardStep('phone');
      return;
    }

    const cleanCode = wizardCode.trim();
    if (!cleanCode) {
      setWizardError('Zadejte prosím kód z SMS zprávy.');
      return;
    }

    setWizardLoading(true);
    setWizardError(null);

    try {
      const res = await confirmBazosVerification({
        sessionId: wizardSessionId,
        code: cleanCode,
        credentialId: currentAccount?.id,
      });

      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      const bkod = res.bkod || 'OK';
      handleVerificationSuccess(bkod);
      setWizardStep('success');
      trackEvent('account_connected', { channel: 'bazos', action: 'sms_verified' });
    } catch (err: any) {
      console.error('Wizard confirm code error:', err);
      setWizardError(err?.message || 'Zadaný kód je neplatný nebo vypršel. Zkontrolujte SMS a zkuste to znovu.');
    } finally {
      setWizardLoading(false);
    }
  };

  // --- VERIFICATION SUCCESS HELPER ---
  const handleVerificationSuccess = (newBkod: string) => {
    setForm((p) => ({
      ...p,
      bazos_bkod: newBkod,
      status_cz: 'OK',
    }));
    setFieldErrors((p) => ({ ...p, bazos_bkod: '' }));
    if (currentAccount) {
      const updatedCookies = {
        has_bazos_bkod: true,
        has_bazos_sk_bkod: Boolean(currentAccount.cookies?.has_bazos_sk_bkod),
        has_sbazar_cookie: Boolean(currentAccount.cookies?.has_sbazar_cookie),
        has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
        has_proxy: Boolean(currentAccount.cookies?.has_proxy),
        has_proxy_sbazar: Boolean(currentAccount.cookies?.has_proxy_sbazar),
      };
      const updated: User = {
        ...currentAccount,
        bazos_bkod: newBkod,
        status_cz: 'OK',
        cookies: updatedCookies,
      };
      secretsCache.current.set(currentAccount.id, updated);
      onAccountsUpdated(updated);
    }
  };

  const handleCheckBkodHealth = async () => {
    if (!currentAccount?.id && !form.bazos_bkod) return;
    setCheckingStatus(true);
    setCheckStatusMsg(null);
    try {
      const res = await checkBazosVerificationStatus({
        credentialId: currentAccount?.id,
        bkod: form.bazos_bkod || undefined,
        email: form.bazos_email || currentAccount?.email,
      });
      if (res.verified) {
        setCheckStatusMsg('✓ Bazoš je aktivní – inzeráty se v pořádku nahrávají');
        setForm((p) => ({ ...p, status_cz: 'OK' }));
      } else {
        setCheckStatusMsg('⚠ Bazoš vyžaduje opětovné ověření přes SMS');
        setForm((p) => ({ ...p, status_cz: 'Not working' }));
      }
    } catch (err: unknown) {
      setCheckStatusMsg(err instanceof Error ? err.message : 'Chyba při kontrole funkčnosti');
    } finally {
      setCheckingStatus(false);
      setTimeout(() => setCheckStatusMsg(null), 6000);
    }
  };

  // --- ADVANCED FORM HANDLERS ---
  const validateBazosForm = (data: Partial<User>): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!String(data.bazos_name || '').trim()) errs.bazos_name = 'Povinné';
    if (!String(data.bazos_email || '').trim()) errs.bazos_email = 'Povinné';
    if (!String(data.bazos_password || '').trim()) errs.bazos_password = 'Povinné';
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

    const errs = validateBazosForm(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError('Vyplňte prosím všechna povinná pole označená hvězdičkou.');
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
        bazos_top_max: Number(form.bazos_top_max) || 0,
      };

      const updated = await updateCredential(currentAccount.id, payload);
      const withSecrets: User = {
        ...currentAccount,
        ...updated,
        bazos_password: String(form.bazos_password || updated.bazos_password || ''),
        bazos_bkod: String(form.bazos_bkod || updated.bazos_bkod || ''),
        bazos_sk_bkod: String(form.bazos_sk_bkod || updated.bazos_sk_bkod || ''),
        cookies: {
          has_bazos_bkod: Boolean(String(form.bazos_bkod || '').trim()),
          has_bazos_sk_bkod: Boolean(String(form.bazos_sk_bkod || '').trim()),
          has_sbazar_cookie: Boolean(currentAccount.cookies?.has_sbazar_cookie),
          has_facebook_cookies: Boolean(currentAccount.cookies?.has_facebook_cookies),
          has_proxy: Boolean(currentAccount.proxy_ip?.trim() || currentAccount.cookies?.has_proxy),
          has_proxy_sbazar: Boolean(
            currentAccount.proxy_ip_sbazar?.trim() || currentAccount.cookies?.has_proxy_sbazar
          ),
        },
      };
      secretsCache.current.set(withSecrets.id, withSecrets);
      onAccountsUpdated(withSecrets);
      trackEvent('account_connected', { channel: 'bazos', action: 'update' });
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
      trackEvent('account_connected', { channel: 'bazos', action: 'create' });
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
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className={`w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col transition-all duration-300 ${
            viewMode === 'advanced' ? 'max-w-5xl max-h-[92vh]' : 'max-w-xl max-h-[90vh]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-linear-to-r from-amber-500/10 via-amber-50/40 to-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF6ED] border border-amber-200 shadow-2xs p-1">
                <svg viewBox="0 0 74 56" className="w-full h-full" fill="none">
                  <path
                    fill="#FF6600"
                    d="M49.15,42.33h6.05c-1.9,3.86-4.8,6.89-8.72,9.08c-4.49,2.51-9.97,3.77-16.43,3.77c-6.25,0-11.65-1.06-16.2-3.18c-4.55-2.12-7.93-5.25-10.15-9.39c-2.22-4.14-3.33-8.64-3.33-13.52c0-5.35,1.26-10.33,3.78-14.94c2.52-4.61,5.97-8.08,10.34-10.39c4.38-2.31,9.38-3.47,15-3.47c4.77,0,9.02,0.93,12.73,2.8c3.71,1.87,6.55,4.52,8.51,7.95c1.96,3.44,2.94,7.19,2.94,11.26c0,4.85-1.49,9.24-4.46,13.16c-3.73,4.95-8.52,7.42-14.35,7.42c-1.57,0-2.76-0.28-3.55-0.83c-0.8-0.55-1.33-1.36-1.59-2.43c-2.24,2.17-4.81,3.25-7.73,3.25c-3.15,0-5.75-1.09-7.83-3.27c-2.07-2.18-3.11-5.08-3.11-8.69c0-4.47,1.25-8.55,3.75-12.25c3.03-4.49,6.92-6.74,11.65-6.74c3.37,0,5.86,1.29,7.47,3.88l0.71-3.17h7.5l-4.29,20.47c-0.27,1.29-0.4,2.13-0.4,2.51c0,0.48,0.11,0.83,0.33,1.07c0.22,0.24,0.48,0.36,0.78,0.36c0.91,0,2.08-0.55,3.52-1.66c1.93-1.45,3.5-3.39,4.69-5.82c1.19-2.44,1.79-4.96,1.79-7.56c0-4.68-1.69-8.6-5.06-11.75c-3.37-3.15-8.08-4.72-14.12-4.72c-5.13,0-9.49,1.05-13.06,3.15c-3.57,2.1-6.26,5.06-8.07,8.88c-1.81,3.82-2.71,7.79-2.71,11.92c0,4.02,1.01,7.67,3.03,10.96c2.02,3.29,4.85,5.7,8.5,7.21c3.65,1.51,7.82,2.27,12.52,2.27c4.53,0,8.42-0.63,11.68-1.9C44.54,46.76,47.16,44.86,49.15,42.33z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-950 sm:text-lg">
                    {viewMode === 'advanced'
                      ? 'Bazoš.cz – Pokročilá správa'
                      : viewMode === 'overview'
                      ? 'Váš Bazoš účet'
                      : 'Propojení s Bazoš.cz'}
                  </h3>
                  {accountIsVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Aktivní
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {viewMode === 'advanced'
                    ? 'Technické nastavení, více účtů, PSČ a hesla'
                    : 'Prodej bez provizí • inzeráty se vystavují a obnovují samy'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'advanced' ? (
                <button
                  type="button"
                  onClick={() => setViewMode(accountIsVerified ? 'overview' : 'wizard')}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  ← Zpět na rychlý přehled
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
                  title="Nastavení hesel, PSČ a dalších účtů"
                >
                  ⚙️ Pokročilé
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* VIEW 1: EASY SETUP WIZARD (DEFAULT FOR NEW USERS) */}
          {viewMode === 'wizard' && (
            <div className="p-6 sm:p-8 overflow-y-auto">
              {/* Stepper indicator */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      wizardStep === 'phone'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {wizardStep === 'phone' ? '1' : '✓'}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    1. Telefonní číslo
                  </span>
                </div>
                <div className="h-0.5 w-8 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      wizardStep === 'code'
                        ? 'bg-amber-500 text-white'
                        : wizardStep === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {wizardStep === 'success' ? '✓' : '2'}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      wizardStep === 'code' ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    2. Kód z SMSky
                  </span>
                </div>
                <div className="h-0.5 w-8 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      wizardStep === 'success'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      wizardStep === 'success' ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    3. Hotovo!
                  </span>
                </div>
              </div>

              {wizardError && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
                  {wizardError}
                </div>
              )}

              {/* STEP 1: PHONE & NAME FORM */}
              {wizardStep === 'phone' && (
                <form onSubmit={handleWizardStart} className="space-y-5">
                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4">
                    <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                      Jak to funguje?
                    </p>
                    <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
                      Zadáte své telefonní číslo a Bazoš vám pošle jednorázový kód.
                      Díky tomu se vaše inzeráty budou vystavovat přímo pod vaším telefonem a automaticky obnovovat bez jakéhokoliv dalšího potvrzování.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">
                      Vaše telefonní číslo <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        autoFocus
                        value={wizardPhone}
                        onChange={(e) => setWizardPhone(e.target.value)}
                        placeholder="+420 777 123 456"
                        className="w-full rounded-2xl border-2 border-slate-300 bg-white px-4 py-3 text-base font-bold text-slate-950 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-2xs transition-all"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Číslo, na které vám budou volat zákazníci a kam Bazoš pošle SMS kód.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Vaše jméno nebo název servisu
                      </label>
                      <input
                        type="text"
                        value={wizardName}
                        onChange={(e) => setWizardName(e.target.value)}
                        placeholder="např. Autodíly Novák"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 outline-none shadow-2xs"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Zobrazuje se u inzerátů na Bazoši
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Město / Obec
                      </label>
                      <input
                        type="text"
                        value={wizardLocation}
                        onChange={(e) => setWizardLocation(e.target.value)}
                        placeholder="např. Plzeň, Praha..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 outline-none shadow-2xs"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Místo odběru nebo sklad
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={wizardLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-black text-white hover:from-amber-600 hover:to-amber-700 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {wizardLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Odesílám žádost na Bazoš…</span>
                        </>
                      ) : (
                        <>
                          <span>📲 Poslat ověřovací SMS z Bazoše</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: SMS CODE INPUT */}
              {wizardStep === 'code' && (
                <form onSubmit={handleWizardConfirmCode} className="space-y-5">
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center">
                    <p className="text-xs font-black text-amber-950">
                      SMS zpráva byla odeslána na číslo:
                    </p>
                    <p className="mt-1 text-base font-black text-amber-900 tracking-wide">
                      {normalizeCzPhone(wizardPhone)}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setWizardStep('phone');
                        setWizardError(null);
                      }}
                      className="mt-2 text-xs font-bold text-amber-800 underline hover:text-amber-950"
                    >
                      Změnit telefonní číslo
                    </button>
                  </div>

                  <div>
                    <label className="block text-center text-xs font-black text-slate-900 mb-2">
                      Přepište kód z SMS zprávy od Bazoše:
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      inputMode="numeric"
                      value={wizardCode}
                      onChange={(e) => setWizardCode(e.target.value)}
                      placeholder="např. 8421"
                      className="w-full text-center tracking-[0.3em] rounded-2xl border-2 border-slate-300 bg-white px-4 py-3.5 text-2xl font-black text-slate-950 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none shadow-2xs"
                    />
                    <p className="mt-2 text-center text-xs text-slate-500">
                      SMSka dorazí do 15–30 vteřin. Obvykle má 4 až 6 číslic.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={wizardLoading || !wizardCode.trim()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white hover:bg-slate-800 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      {wizardLoading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Ověřuji kód u Bazoše…</span>
                        </>
                      ) : (
                        <>
                          <span>✓ Potvrdit a propojit Bazoš</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={wizardLoading}
                      onClick={handleWizardStart}
                      className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Nepřišla SMSka? Poslat znovu
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SUCCESS & VALUE CREATION */}
              {wizardStep === 'success' && (
                <div className="text-center py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-sm">
                    <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-slate-950">
                      Bazoš je úspěšně propojený!
                    </h4>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Telefon <strong className="text-slate-900">{normalizeCzPhone(wizardPhone)}</strong> byl ověřen.
                      Vaše inzeráty se odteď budou automaticky vystavovat pod vaším profilem a sami obnovovat.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 max-w-md mx-auto text-left text-xs space-y-1.5 text-emerald-900">
                    <div className="flex justify-between font-medium">
                      <span>Prodejce:</span>
                      <span className="font-bold">{wizardName || 'Výchozí profil'}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Telefon:</span>
                      <span className="font-bold">{normalizeCzPhone(wizardPhone)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Automatická obnova:</span>
                      <span className="font-bold text-emerald-700">Aktivní (každých 60 dní)</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/create');
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white hover:bg-emerald-700 shadow-md transition-all active:scale-[0.98]"
                    >
                      <span>🚀 Vložit první inzerát hned teď</span>
                      <span>→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('overview')}
                      className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Zobrazit přehled účtu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ACTIVE ACCOUNT OVERVIEW (FOR VERIFIED USERS) */}
          {viewMode === 'overview' && (
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              {/* Account Status Card */}
              <div className="rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/80 to-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Připraveno k okamžitému prodeji
                    </span>
                    <h4 className="mt-2 text-xl font-black text-slate-950">
                      {form.bazos_name || currentAccount?.bazos_name || 'Bazoš prodejní profil'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 font-mono">
                      {currentAccount?.email}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Telefon pro inzerci:</p>
                    <p className="text-sm font-black text-slate-900">
                      {form.telephone1 || currentAccount?.telephone1 || 'Neuvedeno'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-emerald-200/60 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Město odběru:</span>
                    <span className="font-bold text-slate-800">
                      {form.location || currentAccount?.location || 'ČR'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Auto-obnova:</span>
                    <span className="font-bold text-emerald-700">
                      Zapnuta (každých 60 dní)
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[11px]">Stav Bazoš B-kódu:</span>
                    <span className="font-bold text-emerald-700">✓ Aktivní</span>
                  </div>
                </div>
              </div>

              {/* Status Test Message if triggered */}
              {checkStatusMsg && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-bold ${
                    checkStatusMsg.startsWith('✓')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {checkStatusMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push('/create');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white hover:bg-slate-800 shadow-md transition-all active:scale-[0.99]"
                >
                  <span>🚀 Vytvořit nový inzerát na Bazoš</span>
                  <span>→</span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={checkingStatus}
                    onClick={handleCheckBkodHealth}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {checkingStatus ? 'Testuji…' : '🔍 Otestovat funkčnost propojení'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizardStep('phone');
                      setWizardError(null);
                      setViewMode('wizard');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100/70 transition-colors"
                  >
                    📱 Znovu ověřit telefon (SMS)
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('advanced')}
                  className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-1"
                >
                  <span>⚙️ Upravit podrobnosti (PSČ, heslo, limity)</span>
                  <span>→</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Zavřít
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: ADVANCED MODE (FULL SUBACCOUNTS & TECHNICAL CONTROLS) */}
          {viewMode === 'advanced' && (
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Column: Subaccounts list */}
              <div className="md:col-span-5 lg:col-span-4 flex flex-col min-h-0 bg-slate-50/50">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrovat účty..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-950 placeholder:text-slate-400 focus:border-amber-500 outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(true);
                      setNewDraft({
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
                    }}
                    className="shrink-0 rounded-xl bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors shadow-2xs"
                    title="Přidat další Bazoš subúčet"
                  >
                    + Přidat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredAccounts.map((acc) => {
                    const isSelected = !isAddingNew && acc.id === selectedId;
                    const hasBkod = hasBazosBkod(acc);

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(acc.id);
                          setIsAddingNew(false);
                        }}
                        className={`w-full text-left rounded-2xl p-3 transition-all ${
                          isSelected
                            ? 'bg-white shadow-xs border border-amber-300 ring-1 ring-amber-400/20'
                            : 'hover:bg-white/60 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {acc.bazos_name || acc.email.split('@')[0]}
                          </span>
                          {hasBkod ? (
                            <span className="shrink-0 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              ✓ SMS aktivní
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                              Bez B-kódu
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{acc.telephone1 || 'Bez telefonu'}</span>
                          <span>{acc.location ? `${acc.location}` : 'ČR'}</span>
                        </div>
                      </button>
                    );
                  })}

                  {filteredAccounts.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Žádný účet neodpovídá hledání.
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
                          placeholder="novy-prodej@seznam.cz"
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

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bazoš B-kód (pro ČR)
                        </label>
                        <input
                          type="text"
                          value={newDraft.bazos_bkod}
                          onChange={(e) => setNewDraft((p) => ({ ...p, bazos_bkod: e.target.value.toUpperCase() }))}
                          placeholder="volitelné (získá se přes SMS)"
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs font-bold focus:border-amber-500 outline-none text-amber-900 bg-amber-50/30"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-xs"
                      >
                        {saving ? 'Ukládám nový účet…' : '+ Vytvořit subúčet'}
                      </button>
                    </div>
                  </form>
                ) : currentAccount ? (
                  /* Edit Selected Subaccount Form */
                  <form onSubmit={handleSave} className="p-6 space-y-6">
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
                            ✓ Uloženo
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

                    {/* Section 1: Basic Credentials */}
                    <div className="space-y-4">
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Základní údaje prodejce
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Jméno prodejce na Bazoši <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={form.bazos_name || ''}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, bazos_name: e.target.value }));
                              setFieldErrors((p) => ({ ...p, bazos_name: '' }));
                            }}
                            placeholder="např. Václav Novák"
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none ${
                              fieldErrors.bazos_name ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Bazoš přihlašovací e-mail <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={form.bazos_email || ''}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, bazos_email: e.target.value }));
                              setFieldErrors((p) => ({ ...p, bazos_email: '' }));
                            }}
                            placeholder="vas@email.cz"
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none ${
                              fieldErrors.bazos_email ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-slate-700">
                              Bazoš heslo <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPassword((p) => !p)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                            >
                              {showPassword ? 'Skrýt' : 'Zobrazit'}
                            </button>
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={form.bazos_password || ''}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, bazos_password: e.target.value }));
                              setFieldErrors((p) => ({ ...p, bazos_password: '' }));
                            }}
                            placeholder="Heslo k Bazoš účtu"
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none ${
                              fieldErrors.bazos_password ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Telefon pro SMS autorizaci <span className="text-rose-500">*</span>
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
                            className={`w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none ${
                              fieldErrors.telephone1 ? 'border-rose-400' : 'border-slate-200'
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: SMS Verification & B-codes */}
                    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">
                            B
                          </span>
                          <h5 className="text-xs font-black text-amber-950">
                            Ověření telefonu pro vkládání bez SMS
                          </h5>
                          {loadingSecrets && (
                            <span className="text-[10px] font-semibold text-amber-700/80 animate-pulse">
                              Načítám…
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {form.bazos_bkod ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                              ✓ Telefon ověřen
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-900">
                              ⚠ Čeká na SMS
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setVerifyModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-xs"
                          >
                            📱 {form.bazos_bkod ? 'Znovu ověřit SMS' : 'Ověřit telefon (SMS)'}
                          </button>

                          {form.bazos_bkod && (
                            <button
                              type="button"
                              disabled={checkingStatus}
                              onClick={handleCheckBkodHealth}
                              className="inline-flex items-center gap-1 rounded-xl bg-white border border-amber-300 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100/60 transition-all"
                            >
                              {checkingStatus ? 'Testuji…' : 'Otestovat'}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-bold text-amber-950 mb-1">
                            B-kód pro ČR (Bazoš.cz)
                          </label>
                          <input
                            type="text"
                            value={form.bazos_bkod || ''}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, bazos_bkod: e.target.value.toUpperCase() }));
                            }}
                            placeholder="Získá se automaticky přes SMS"
                            className="w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs font-bold text-slate-950 focus:border-amber-600 outline-none border-amber-300"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-amber-950 mb-1">
                            B-kód pro Slovensko (Bazoš.sk)
                          </label>
                          <input
                            type="text"
                            value={form.bazos_sk_bkod || ''}
                            onChange={(e) => {
                              setForm((p) => ({ ...p, bazos_sk_bkod: e.target.value.toUpperCase() }));
                            }}
                            placeholder="Volitelné pro prodej na Slovensko"
                            className="w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs font-bold text-slate-950 focus:border-amber-600 outline-none border-amber-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Location & ZIP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Lokalita / Město <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={form.location || ''}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, location: e.target.value }));
                          }}
                          placeholder="Praha, Plzeň, Brno..."
                          className="w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none border-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Výchozí PSČ (ČR) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          value={form.zipcode || ''}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, zipcode: e.target.value }));
                          }}
                          placeholder="např. 30100"
                          className="w-full rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-950 focus:border-amber-500 outline-none border-slate-200"
                        />
                      </div>
                    </div>

                    {/* Section 4: Automation Switches */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Automatizace inzerce
                      </h5>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Automatické obnovování inzerátů (Auto-renew)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Inzerát se před vypršením automaticky smaže a vloží znovu na první pozice
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
                            Měsíční limit pro placené TOPování (Kč)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Zadejte 0 pro bezplatnou inzerci bez placených posunů
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

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
                      >
                        {saving ? 'Ukládám…' : 'Uložit nastavení'}
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
          )}
        </div>
      </div>

      <BazosVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        onSuccess={handleVerificationSuccess}
        credentialId={currentAccount?.id}
        initialPhone={form.telephone1 || currentAccount?.telephone1 || ''}
        accountEmail={form.bazos_email || currentAccount?.email}
        accountName={form.bazos_name || currentAccount?.bazos_name || ''}
      />
    </>
  );
}
