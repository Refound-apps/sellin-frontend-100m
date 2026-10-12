'use client';

import { useState, useEffect, useRef } from 'react';
import {
  startBazosVerification,
  confirmBazosVerification,
  checkBazosVerificationStatus,
  cancelBazosVerification,
  BazosVerifyConfirmResponse,
} from '@/lib/api';

interface BazosVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bkod: string) => void;
  credentialId?: number;
  initialPhone?: string;
  accountEmail?: string;
  accountName?: string;
}

export default function BazosVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  credentialId,
  initialPhone = '',
  accountEmail,
  accountName,
}: BazosVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'success' | 'bank'>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [code, setCode] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [checkingBank, setCheckingBank] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bkodResult, setBkodResult] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState<BazosVerifyConfirmResponse['bankInfo'] | null>(null);
  const [copiedBkod, setCopiedBkod] = useState(false);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Sync initial phone when opened
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone || '');
      setStep('phone');
      setCode('');
      setError(null);
      setSessionId(null);
      setBkodResult(null);
      setBankInfo(null);
    }
  }, [isOpen, initialPhone]);

  // Auto-focus code input when reaching step 2
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 200);
    }
  }, [step]);

  // Clean up session if user closes modal early
  const handleClose = () => {
    if (sessionId) {
      cancelBazosVerification(sessionId).catch(() => {});
    }
    onClose();
  };

  const handleStartVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Vyplňte prosím telefonní číslo.');
      return;
    }
    if (!agreeTerms) {
      setError('Musíte potvrdit souhlas s podmínkami Bazoš.cz.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await startBazosVerification({
        phone: phone.trim(),
        credentialId,
        email: accountEmail,
      });

      if (res.status === 'already_verified' && res.bkod) {
        setBkodResult(res.bkod);
        setStep('success');
        onSuccess(res.bkod);
        return;
      }

      if (res.sessionId) {
        setSessionId(res.sessionId);
        setStep('code');
      } else {
        throw new Error('Nepodařilo se získat ID ověřovací relace.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba při zahájení ověření.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      setError('Relace vypršela. Začněte prosím znovu.');
      return;
    }
    if (!code.trim()) {
      setError('Zadejte ověřovací kód z SMS zprávy.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await confirmBazosVerification({
        sessionId,
        code: code.trim(),
        credentialId,
      });

      if (res.status === 'bank_required') {
        setBkodResult(res.bkod || null);
        setBankInfo(res.bankInfo || null);
        setStep('bank');
        if (res.bkod) {
          onSuccess(res.bkod);
        }
      } else {
        setBkodResult(res.bkod || null);
        setStep('success');
        if (res.bkod) {
          onSuccess(res.bkod);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba při ověřování kódu.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBankStatus = async () => {
    setCheckingBank(true);
    setError(null);
    try {
      const res = await checkBazosVerificationStatus({
        credentialId,
        bkod: bkodResult || undefined,
        email: accountEmail,
      });

      if (res.verified) {
        setStep('success');
        if (res.bkod) {
          onSuccess(res.bkod);
        }
      } else {
        setError('Platba ještě nebyla Bazošem spárována. Chvíli vyčkejte a zkuste to znovu za 1–2 minuty.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Chyba při kontrole stavu ověření.');
    } finally {
      setCheckingBank(false);
    }
  };

  const copyBkod = () => {
    if (bkodResult && navigator?.clipboard) {
      navigator.clipboard.writeText(bkodResult);
      setCopiedBkod(true);
      setTimeout(() => setCopiedBkod(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-sm shadow-xs">
              B
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ověření telefonu na Bazoš.cz
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {accountName ? `${accountName} (${accountEmail || ''})` : accountEmail || 'Prodejní účet'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-3 border-b border-slate-100 text-center text-xs font-bold">
          <div
            className={`py-2.5 transition-colors border-b-2 ${
              step === 'phone'
                ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            1. Telefon
          </div>
          <div
            className={`py-2.5 transition-colors border-b-2 ${
              step === 'code'
                ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            2. SMS Kód
          </div>
          <div
            className={`py-2.5 transition-colors border-b-2 ${
              step === 'success' || step === 'bank'
                ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            3. Ověřeno
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 animate-in fade-in">
              <span className="font-bold">Chyba: </span>
              {error}
            </div>
          )}

          {/* STEP 1: Phone input */}
          {step === 'phone' && (
            <form onSubmit={handleStartVerification} className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Před prvním vystavením inzerátu vyžaduje Bazoš ověření telefonního čísla.
                  Bazoš na zadané číslo zašle <strong>jednorázový SMS kód</strong>.
                </p>

                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Telefonní číslo pro SMS ověření <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 777 123 456"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none shadow-xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  České číslo (+420). Telefonní číslo nebude v inzerátech nutně zveřejněno.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span>
                    Souhlasím s{' '}
                    <a
                      href="https://www.bazos.cz/podminky.php"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-600 font-bold hover:underline"
                    >
                      podmínkami serveru Bazoš.cz
                    </a>{' '}
                    (Bazoš tento souhlas vyžaduje).
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Komunikuji s Bazošem…
                    </>
                  ) : (
                    'Odeslat SMS s kódem →'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: SMS Code input */}
          {step === 'code' && (
            <form onSubmit={handleConfirmCode} className="space-y-5">
              <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-950">
                <p className="font-semibold">
                  SMS s kódem byla odeslána na číslo <strong>{phone}</strong>.
                </p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800">
                  <span>Může to trvat 10–30 sekund.</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sessionId) cancelBazosVerification(sessionId).catch(() => {});
                      setStep('phone');
                    }}
                    className="font-bold underline hover:text-amber-950"
                  >
                    Změnit číslo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 text-center">
                  Zadejte ověřovací kód z SMS <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  placeholder="např. 849201"
                  className="w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-mono font-bold tracking-widest text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none shadow-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (sessionId) cancelBazosVerification(sessionId).catch(() => {});
                    setStep('phone');
                  }}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zpět
                </button>
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Ověřuji kód…
                    </>
                  ) : (
                    'Ověřit a dokončit ✓'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3A: Successfully Verified */}
          {step === 'success' && (
            <div className="space-y-5 text-center py-2 animate-in fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 text-2xl font-black">
                ✓
              </div>

              <div>
                <h4 className="text-base font-black text-slate-950">
                  Telefon byl úspěšně ověřen!
                </h4>
                <p className="mt-1 text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Bazoš vygeneroval trvalý autorizační B-kód. Tento kód jsme automaticky uložili k vašemu účtu pro bezproblémové vkládání inzerátů bez dalších SMS.
                </p>
              </div>

              {bkodResult && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 max-w-xs mx-auto">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    Váš B-kód pro Bazoš
                  </div>
                  <div className="flex items-center justify-center gap-2 font-mono text-sm font-bold text-emerald-950">
                    <span>{bkodResult}</span>
                    <button
                      type="button"
                      onClick={copyBkod}
                      className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs hover:bg-emerald-100 border border-emerald-200"
                    >
                      {copiedBkod ? 'Zkopírováno ✓' : 'Kopírovat'}
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-slate-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-xs"
                >
                  Pokračovat k inzerci
                </button>
              </div>
            </div>
          )}

          {/* STEP 3B: Bank verification required (for completely new numbers) */}
          {step === 'bank' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                <span className="text-xl">ℹ️</span>
                <div className="text-xs text-amber-950 space-y-1">
                  <p className="font-bold">
                    SMS ověřena! Bazoš vyžaduje propojení s bankovním účtem.
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    U nových telefonních čísel Bazoš vyžaduje jednorázovou mikroplatbu <strong>1 Kč</strong> pro prevenci podvodů. Platba platí 1 rok.
                  </p>
                </div>
              </div>

              {bankInfo?.qrSrc && (
                <div className="text-center py-2">
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    QR platba (naskenujte v mobilním bankovnictví):
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bankInfo.qrSrc}
                    alt="Bazoš QR platba"
                    className="mx-auto h-40 w-40 rounded-xl border border-slate-200 shadow-xs"
                  />
                </div>
              )}

              {bankInfo?.infoText && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {bankInfo.infoText}
                </div>
              )}

              <div className="rounded-xl bg-slate-100/70 p-3 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Postup:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Odešlete 1 Kč ze svého bankovního účtu přesně dle instrukcí Bazoše výše.</li>
                  <li>Jako zprávu pro příjemce uveďte své telefonní číslo.</li>
                  <li>U okamžité platby je propojení hotové do 1 minuty.</li>
                  <li>Následně klikněte na tlačítko &quot;Zkontrolovat stav&quot;.</li>
                </ol>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zavřít a zaplatit později
                </button>
                <button
                  type="button"
                  onClick={handleCheckBankStatus}
                  disabled={checkingBank}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-all shadow-xs disabled:opacity-50"
                >
                  {checkingBank ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Kontroluji platbu…
                    </>
                  ) : (
                    '🔄 Zkontrolovat stav'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
