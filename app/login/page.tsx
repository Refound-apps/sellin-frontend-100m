'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type AuthMode = 'login' | 'register' | 'forgot';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Nesprávný e-mail nebo heslo. Pokud se přihlašujete poprvé a máte u nás již účet, zvolte záložku "Registrace".');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Pokud je uživatel administrátor a nebyl explicitně vyžádán jiný cíl (výchozí '/'), přesměrovat do /admin/offers
      let targetPath = redirectTo;
      if (targetPath === '/') {
        const { data: credential } = await supabase
          .from('credential_pg')
          .select('role')
          .ilike('email', email.trim())
          .limit(1)
          .maybeSingle();

        if (credential?.role === 'admin') {
          targetPath = '/admin/offers';
        }
      }

      router.push(targetPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Nastala neočekávaná chyba při přihlašování.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Tento účet již existuje. Můžete se rovnou přihlásit heslem v záložce Přihlášení.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Pokud Supabase nevyžaduje potvrzení e-mailu a uživatel má aktivní session:
      if (data.session) {
        router.push(redirectTo);
        router.refresh();
        return;
      }

      // Pokud Supabase zaslala potvrzovací e-mail:
      setSuccessMessage(
        `Registrace proběhla úspěšně! Na adresu ${email} jsme odeslali potvrzovací e-mail. Po kliknutí na odkaz se váš účet automaticky propojí s vašimi inzeráty a nastavením.`
      );
    } catch (err: any) {
      setError(err?.message || 'Nastala chyba při vytváření účtu.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccessMessage(
        `Odkaz pro obnovu hesla byl odeslán na adresu ${email}. Zkontrolujte svoji e-mailovou schránku a pokračujte kliknutím na odkaz v e-mailu.`
      );
    } catch (err: any) {
      setError(err?.message || 'Nastala chyba při odesílání žádosti.');
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

          {mode === 'forgot' ? (
            <div className="mt-2.5">
              <h2 className="text-base font-bold text-slate-900">Obnova zapomenutého hesla</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Zadejte svůj e-mail a my vám zašleme odkaz pro nastavení nového hesla.
              </p>
            </div>
          ) : (
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Automat na inzerci, sklad a prodej
            </p>
          )}
        </div>

        {/* Přepínač režimů (zobrazuje se pro login i registrace) */}
        {mode !== 'forgot' ? (
          <div className="flex rounded-2xl bg-slate-100/85 p-1 text-xs font-semibold ring-1 ring-slate-200/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 rounded-xl py-2 transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-950 font-bold shadow-[0_2px_8px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Přihlášení
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 rounded-xl py-2 transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-950 font-bold shadow-[0_2px_8px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Registrace
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
            >
              ← Zpět na přihlášení
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 leading-relaxed shadow-xs">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-800 leading-relaxed shadow-xs">
            <p className="font-bold mb-1">Hotovo!</p>
            {successMessage}
          </div>
        )}

        {/* 1. Formulář přihlášení */}
        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                E-mailová adresa
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="mt-1.5 block w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Heslo
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  Zapomenuté heslo?
                </button>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                  <span>Ověřuji a přihlašuji…</span>
                </>
              ) : (
                <span>Přihlásit se</span>
              )}
            </button>
          </form>
        )}

        {/* 2. Formulář registrace */}
        {mode === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3.5 text-xs text-emerald-950 leading-relaxed shadow-[inset_0_1px_2px_rgba(16,185,129,0.04)]">
              💡 <strong>Pro stávající prodejce:</strong> Zadejte svůj e-mail. Registrací si k němu nastavíte vlastní heslo a Prodejomat váš účet automaticky spáruje se všemi vašimi existujícími inzeráty, Bazošem i Sbazar účty.
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                E-mailová adresa
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="mt-1.5 block w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Zvolte heslo
              </label>
              <input
                id="reg-password"
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
              <label htmlFor="reg-confirm" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Potvrzení hesla
              </label>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Zopakujte heslo"
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
                  <span>Vytvářím účet…</span>
                </>
              ) : (
                <span>Zaregistrovat se</span>
              )}
            </button>
          </form>
        )}

        {/* 3. Formulář obnovy hesla */}
        {mode === 'forgot' && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="forgot-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                E-mailová adresa
              </label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.cz"
                className="mt-1.5 block w-full rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(0,0,0,0.02)] transition-all focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              />
              <p className="mt-2 text-xs text-slate-500">
                Na tento e-mail vám zašleme bezpečný odkaz, přes který si zvolíte nové heslo.
              </p>
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
                  <span>Odesílám odkaz…</span>
                </>
              ) : (
                <span>Odeslat odkaz pro obnovu hesla</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">Načítání...</div>}>
      <AuthForm />
    </Suspense>
  );
}
