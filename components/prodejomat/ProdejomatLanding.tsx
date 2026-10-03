'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface ProdejomatLandingProps {
  user?: { email?: string; id?: string } | null;
  role?: 'admin' | 'seller';
}

export default function ProdejomatLanding({
  user: initialUser,
  role: initialRole = 'seller',
}: ProdejomatLandingProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeUser, setActiveUser] = useState(initialUser || null);
  const [activeRole, setActiveRole] = useState<'admin' | 'seller'>(initialRole);

  useEffect(() => {
    const isExplicitLanding =
      pathname === '/landing' ||
      searchParams?.get('landing') === '1' ||
      searchParams?.get('landing') === 'true' ||
      searchParams?.get('preview') === 'landing';

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setActiveUser({ email: data.user.email, id: data.user.id });

        supabase
          .from('credential_pg')
          .select('role')
          .or(`user_id.eq.${data.user.id},email.ilike.${data.user.email}`)
          .limit(1)
          .maybeSingle()
          .then(({ data: cred }) => {
            const resolvedRole = cred?.role === 'admin' ? 'admin' : 'seller';
            setActiveRole(resolvedRole);

            // Pokud uživatel nežádá explicitně o zobrazení landing page,
            // automaticky ho okamžitě přeneseme do jeho appky (smooth UX):
            if (!isExplicitLanding) {
              if (resolvedRole === 'admin') {
                router.replace('/admin/offers');
              } else if (pathname === '/') {
                router.refresh();
              } else {
                router.replace('/');
              }
            }
          });
      }
    });
  }, [pathname, searchParams, router]);

  const targetAppHref = activeRole === 'admin' ? '/admin/offers' : '/';
  const ctaHref = activeUser ? targetAppHref : '/login';
  const ctaText = activeUser ? 'Přejít do aplikace' : 'Vstoupit do aplikace';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[hsl(210_28%_97%)] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950">
      {/* Ambientní podsvícení inspirované loginem (Apple/Spotify glow) */}
      <div className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[36rem] w-[50rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/12 via-teal-500/8 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-[38rem] -right-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-slate-400/10 blur-3xl" />
      <div className="pointer-events-none absolute top-[70rem] -left-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/8 blur-3xl" />

      {/* --- HERO SECTION --- */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8 text-center">
        {/* Status Pill s pulzující tečkou */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-md transition hover:border-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="tracking-wide">Autopilot pro prodejce • Bazoš, Sbazar a vlastní e-shop</span>
        </div>

        {/* Úderný Apple H1 Headline se slovem PRODEJ */}
        <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl sm:leading-[1.1] lg:text-7xl">
          Prodej na autopilotu.{' '}
          <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
            Nahrajte jednou. Prodejte všude.
          </span>
        </h1>

        {/* Intuitivní a čistý podtitul */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg sm:leading-relaxed">
          Centrální sklad pro Bazoš, Sbazar i váš vlastní e-shop. Prodejomat se postará o okamžité
          vystavení, automatickou obnovu inzerátů a synchronizaci skladu, abyste prodávali víc a bez starostí.
        </p>

        {/* CTA tlačítka (Spotify + Apple styl) */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:gap-4">
          <Link
            href={ctaHref}
            className="group relative inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 px-8 py-4 text-base font-bold text-white shadow-[0_12px_28px_-6px_rgba(15,23,42,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/15 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_16px_32px_-6px_rgba(15,23,42,0.45)] active:scale-[0.98] sm:w-auto"
          >
            {/* Subtilní horní světelná linka (sheen) */}
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
            <span>{ctaText}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1 text-emerald-400">→</span>
          </Link>

          {!activeUser && (
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200/90 bg-white/90 px-7 py-4 text-base font-semibold text-slate-800 shadow-2xs backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-slate-950 hover:border-slate-300 active:scale-[0.98] sm:w-auto"
            >
              Přihlásit se do účtu
            </Link>
          )}
        </div>

        {/* Drobné garance v řádku */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Během 2 minut v provozu
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Plně automatická obnova
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            0 duplicit ve skladu
          </span>
        </div>
      </section>

      {/* --- LIVE SHOWCASE ENGINE (Spotify / Apple Studio Window) --- */}
      <section className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-3 shadow-[0_30px_70px_-15px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-5">
          {/* Záře na hraně okna */}
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          {/* Horní ovládací lišta okna */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-3 pb-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/70 px-3 py-1 text-[11px] font-mono text-slate-300 ring-1 ring-white/10">
              <span className="text-emerald-400">●</span>
              <span>app.prodejomat.cz</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Autopilot aktivní
            </div>
          </div>

          {/* Třísloupcový vizuální diagram synchronizace */}
          <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
            {/* Sloupec 1: Centrální sklad */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Centrální sklad</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">1× nahráno</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="rounded-xl border border-slate-700/60 bg-slate-850 p-2.5 text-xs">
                  <div className="font-semibold text-white">Sada ALU kol Škoda R18</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-emerald-400">14 900 Kč</span>
                    <span className="text-slate-500">1 sada</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/60 bg-slate-850 p-2.5 text-xs">
                  <div className="font-semibold text-white">Zimní pneu Barum 205/55</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-emerald-400">3 800 Kč</span>
                    <span className="text-slate-500">4 ks</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Fotky, rozměry a ceny spravujete pouze na jednom místě.
              </p>
            </div>

            {/* Sloupec 2: Prodejomat Autopilot Engine */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl" />
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Prodejomat Engine</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-2.5 py-2 text-slate-200 border border-emerald-500/20">
                    <span className="text-emerald-400">⚡</span>
                    <span className="text-[11px]">Auto obnova Bazoš &amp; Sbazar</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-2.5 py-2 text-slate-200 border border-emerald-500/20">
                    <span className="text-emerald-400">🔄</span>
                    <span className="text-[11px]">Stažení položky při prodeji</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-2.5 py-2 text-slate-200 border border-emerald-500/20">
                    <span className="text-emerald-400">🤖</span>
                    <span className="text-[11px]">AI rozpad parametrů &amp; SEO</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-slate-900/80 p-2 text-center text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                100% automatizováno na pozadí
              </div>
            </div>

            {/* Sloupec 3: Propojené kanály */}
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Aktivní kanály</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Synchronizováno
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🏷️</span>
                    <div>
                      <div className="font-semibold text-white text-[11px]">Bazoš.cz</div>
                      <div className="text-[10px] text-emerald-400">Topováno &amp; obnoveno</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">Aktivní</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛒</span>
                    <div>
                      <div className="font-semibold text-white text-[11px]">Sbazar.cz</div>
                      <div className="text-[10px] text-emerald-400">Topováno</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">Aktivní</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛍️</span>
                    <div>
                      <div className="font-semibold text-white text-[11px]">Vlastní E-shop</div>
                      <div className="text-[10px] text-emerald-400">alubazarplzen.cz</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 3 HLAVNÍ PILÍŘE (Apple Bento Box styl) --- */}
      <section id="funkce" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Jednoduchost bez kompromisů
          </h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Vše, co prodejce potřebuje. Nic navíc.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Karta 1 */}
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-xs">
              <span className="text-xl">⚡</span>
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
              Autopilot na Bazoš a Sbazar
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Inzeráty na bazarech po pár dnech zapadnou. Prodejomat je pravidelně a bezpečně obnovuje,
              aby byly stále na očích zájemcům — aniž byste museli hnout prstem.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
              ✓ Ušetříte 15+ hodin týdně
            </div>
          </div>

          {/* Karta 2 */}
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-xs">
              <span className="text-xl">🛍️</span>
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
              Vlastní e-shop za 0 minut
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Z vašich inzerátů okamžitě vzniká profesionální storefront na vaší doméně s košíkem,
              rezervacemi, XML feedy pro Google i Seznam a optimalizací pro AI nákupní asistenty.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
              ✓ Vlastní značka &amp; důvěra
            </div>
          </div>

          {/* Karta 3 */}
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_20px_40px_-15px_rgba(15,23,42,0.06)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-xs">
              <span className="text-xl">🔄</span>
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
              Centrální sklad bez duplicit
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Prodali jste sadu disků na Bazoši? Prodejomat ji během vteřiny stáhne z e-shopu i Sbazaru.
              Už žádné trapné telefonáty zákazníkům, že zboží je už prodané.
            </p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800">
              ✓ 0 duplicitních prodejů
            </div>
          </div>
        </div>
      </section>

      {/* --- JAK TO FUNGUJE (3 KROKY) --- */}
      <section id="jak-to-funguje" className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-8 sm:p-12 shadow-xs backdrop-blur-md">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Jednoduchý proces
            </h2>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Jak začít prodávat na autopilotu
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-xs">
                1
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Napojte své účty</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Připojte Bazoš, Sbazar nebo vlastní doménu během minuty v sekci Napojení účtů.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-xs">
                2
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Nahrajte zboží</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Vložte fotky, rozměry a cenu. Zboží je uloženo v centrálním skladu.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white shadow-xs">
                3
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Prodávejte</h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Prodejomat inzeráty vystaví, automaticky obnovuje a synchronizuje objednávky.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINÁLNÍ SPOTIFY-STYLE HERO BANNER --- */}
      <section className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-8 sm:p-14 text-center text-white shadow-2xl ring-1 ring-white/10">
          <div className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-48 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Čas přestat přepisovat inzeráty ručně.
            </h2>
            <p className="mt-3 text-sm text-slate-300 sm:text-base">
              Vstupte do Prodejomatu a mějte sklad, inzerci i e-shop plně pod kontrolou.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={ctaHref}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-bold text-slate-950 shadow-[0_10px_25px_-5px_rgba(34,197,94,0.4)] transition-all duration-200 hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{ctaText}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- MINIMALISTICKÝ FOOTER (Apple styl) --- */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-10 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white shadow-xs">
                P
              </div>
              <div className="flex items-baseline">
                <span className="text-base font-black tracking-tight text-slate-950">
                  Prodej<span className="text-emerald-600">omat</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 ml-0.5">.cz</span>
              </div>
              <span className="hidden sm:inline-block text-xs text-slate-400 ml-3">
                • Automat na inzerci, sklad a prodej
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-500">
              <Link href="/login" className="hover:text-slate-950 transition-colors">
                Přihlášení
              </Link>
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Všechny systémy v provozu
              </span>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} Prodejomat.cz. Všechna práva vyhrazena.
          </div>
        </div>
      </footer>
    </div>
  );
}
