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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[hsl(214_24%_88%)] bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(222_47%_11%)] text-2xl font-bold text-white shadow-md">
            S
          </div>
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-[hsl(222_47%_11%)]">
            Nastavení nového hesla
          </h2>
          <p className="mt-1.5 text-center text-xs text-[hsl(222_20%_48%)]">
            Zadejte své nové heslo pro přihlášení do Sellin.cz
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 leading-relaxed">
            {error}
          </div>
        )}

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-medium text-emerald-800 leading-relaxed">
            <p className="font-bold text-sm mb-1">Heslo bylo úspěšně změněno!</p>
            <p>Přesměrováváme vás do aplikace...</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]"
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[hsl(222_20%_40%)]"
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
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[hsl(222_47%_11%)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(222_47%_11%)]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-[hsl(222_47%_11%)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(222_47%_18%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(222_47%_11%)] disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Uložit nové heslo'}
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
