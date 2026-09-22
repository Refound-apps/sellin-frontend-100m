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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[hsl(214_24%_88%)] bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(222_47%_11%)] text-2xl font-bold text-white shadow-md">
            S
          </div>
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-[hsl(222_47%_11%)]">
            {mode === 'login' && 'Přihlášení do Sellin.cz'}
            {mode === 'register' && 'Registrace do Sellin.cz'}
            {mode === 'forgot' && 'Obnova zapomenutého hesla'}
          </h2>
          <p className="mt-1.5 text-center text-xs text-[hsl(222_20%_48%)]">
            {mode === 'register'
              ? 'Pokud u nás už máte účet z dřívějška, zadejte svůj původní e-mail – data se automaticky propojí.'
              : mode === 'forgot'
              ? 'Zadejte svůj e-mail a my vám zašleme odkaz pro nastavení nového hesla.'
              : 'Centrální správa inzerátů, prodejců a skladů'}
          </p>
        </div>

        {/* Přepínač režimů (zobrazuje se pro login i registrace) */}
        {mode !== 'forgot' ? (
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 rounded-lg py-2 transition ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
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
              className={`flex-1 rounded-lg py-2 transition ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
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
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              ← Zpět na přihlášení
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 leading-relaxed">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 leading-relaxed">
            <p className="font-bold mb-1">Hotovo!</p>
            {successMessage}
          </div>
        )}

        {/* 1. Formulář přihlášení */}
        {mode === 'login' && (
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
                  Heslo
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-medium text-[hsl(222_47%_25%)] hover:underline"
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-[hsl(222_47%_11%)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(222_47%_18%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(222_47%_11%)] disabled:opacity-50"
            >
              {loading ? 'Přihlašuji...' : 'Přihlásit se'}
            </button>
          </form>
        )}

        {/* 2. Formulář registrace */}
        {mode === 'register' && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900 leading-relaxed">
              💡 <strong>Pro stávající prodejce:</strong> Zadejte svůj původní e-mail ze Sellinu. Registrací si k němu nastavíte vlastní heslo a systém váš účet automaticky spáruje se všemi vašimi inzeráty, Bazošem i Sbazar credentials.
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-[hsl(222_47%_11%)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(222_47%_18%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(222_47%_11%)] disabled:opacity-50"
            >
              {loading ? 'Vytvářím účet...' : 'Zaregistrovat se'}
            </button>
          </form>
        )}

        {/* 3. Formulář obnovy hesla */}
        {mode === 'forgot' && (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]">
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
              <p className="mt-2 text-xs text-slate-500">
                Na tento e-mail vám zašleme bezpečný odkaz, přes který si zvolíte nové heslo.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-[hsl(222_47%_11%)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(222_47%_18%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(222_47%_11%)] disabled:opacity-50"
            >
              {loading ? 'Odesílám...' : 'Odeslat odkaz pro obnovu hesla'}
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
