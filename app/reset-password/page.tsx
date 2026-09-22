'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Zadaná hesla se neshodují.');
      return;
    }

    if (password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Nastala chyba při ukládání nového hesla.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decentní ambientní podsvícení pro hloubku pozadí */}
      <div className="pointer-events-none absolute -top-44 left-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-slate-400/10 blur-3xl" />

      <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-slate-200/80 bg-white/95 p-8 shadow-[0_24px_50px_-12px_rgba(15,23,42,0.12),0_4px_16px_rgba(15,23,42,0.04)] backdrop-blur-md sm:p-10 ring-1 ring-black/[0.03] overflow-hidden">
        {/* Subtilní horní načítací linka (progress pulse) */}
        {loading ? (
          <div className="absolute inset-x-0 top-0 h-[2.5px] overflow-hidden bg-slate-100 z-20">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500 via-slate-900 to-emerald-500 animate-progress-pulse" />
          </div>
        ) : (
          /* Subtilní horní světelná linka (sheen) */
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
        )}

        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-[0_10px_25px_-5px_rgba(15,23,42,0.35),0_4px_10px_-2px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-white/15 transition-transform hover:scale-105">
            <span className="text-2xl font-black tracking-tight text-white drop-shadow-xs">P</span>
          </div>
          <div className="mt-3.5 flex items-baseline justify-center">
            <span className="text-2xl font-black tracking-tight text-slate-950">
              Prodej<span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">omat</span>
            </span>
            <span className="text-xs font-bold text-slate-400 ml-0.5">.cz</span>
          </div>
          <h2 className="mt-2.5 text-base font-bold tracking-tight text-slate-900">
            Nastavení nového hesla
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Zadejte své nové heslo pro přihlášení do Prodejomat.cz
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 leading-relaxed shadow-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-center text-xs font-medium text-emerald-800 leading-relaxed shadow-xs">
            <p className="font-bold text-sm mb-1">Heslo bylo úspěšně změněno!</p>
            <p>Přesměrováváme vás do aplikace...</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div>
              <label
                htmlFor="new-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Nové heslo
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimálně 6 znaků"
                className="mt-1.5 block w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-[11px] font-bold uppercase tracking-wider text-slate-600"
              >
                Potvrzení nového hesla
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zopakujte nové heslo"
                className="mt-1.5 block w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.22),inset_0_1px_1px_rgba(255,255,255,0.18)] ring-1 ring-slate-950/80 transition-all hover:from-slate-800 hover:to-slate-900 hover:shadow-[0_6px_20px_rgba(15,23,42,0.28)] active:scale-[0.99] active:shadow-[0_2px_8px_rgba(15,23,42,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white/90" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Ukládám nové heslo…</span>
                </>
              ) : (
                <span>Uložit nové heslo</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
          Načítání...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
