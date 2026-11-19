import type { ReactNode } from 'react';
import Link from 'next/link';

interface ProdejomatLandingProps {
  user?: { email?: string; id?: string } | null;
}

const PRICING = [
  {
    id: 'start',
    name: 'Start',
    price: '1 990',
    hint: 'do ~50 nabídek',
    description: 'Pro menší objem. Bazoš, obnova, základní sklad.',
    features: ['Bazoš (+ Sbazar)', 'Automatická obnova', 'Centrální sklad', 'E-mail podpora'],
    highlighted: false,
  },
  {
    id: 'profi',
    name: 'Profi',
    price: '4 990',
    hint: 'do ~250 nabídek',
    description: 'Pro pneuservisy a střední vrakoviště. Multi-kanál + e-shop.',
    features: [
      'Vše ze Startu',
      'Bazoš, Sbazar i e-shop',
      'Vlastní e-shop',
      'Prioritní obnova',
    ],
    highlighted: true,
  },
  {
    id: 'firma',
    name: 'Firma',
    price: '9 990',
    hint: 'vysoký objem',
    description: 'Pro velké sklady. Více účtů, onboarding a priorita podpory.',
    features: [
      'Vše z Profi',
      'Více účtů (CZ/SK)',
      'Záložní napojení kanálů',
      'Onboarding + priorita podpory',
    ],
    highlighted: false,
  },
] as const;

const PAINS = [
  {
    pain: 'Inzeráty za pár dní zmizí z očí',
    title: 'Pořád vás najdou',
    body: 'Obnova na Bazoši a Sbazaru běží sama. Vy berete telefony, ne klikáte obnovit.',
    icon: 'eye' as const,
  },
  {
    pain: 'Stejné zboží přepisujete na 3 místech',
    title: 'Jednou naskladnit, prodat všude',
    body: 'Sklad je jedna pravda. Bazoš, Sbazar, e-shop, Google i Seznam berou ze stejného místa.',
    icon: 'layers' as const,
  },
  {
    pain: 'Prodáno tady — pořád visí jinde',
    title: 'Prodej = stažení všude',
    body: 'Žádné dvojprodeje, žádné trapné hovory. Sklad se synchronizuje sám.',
    icon: 'sync' as const,
  },
  {
    pain: 'Celý prodej visí na jednom portálu',
    title: 'Sklad a e-shop jsou vaše',
    body: 'Portály jsou trubky. Nabídky, fotky a ceny držíte u sebe — a prodáváte na víc místech.',
    icon: 'shield' as const,
  },
] as const;

function PainIcon({ name }: { name: (typeof PAINS)[number]['icon'] }) {
  const common = 'h-5 w-5';
  switch (name) {
    case 'eye':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"
          />
          <circle cx="12" cy="12" r="2.8" strokeWidth={1.8} />
        </svg>
      );
    case 'layers':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="m12 4 8 4.5L12 13 4 8.5 12 4Zm-8 7.5 8 4.5 8-4.5M4 16l8 4.5L20 16"
          />
        </svg>
      );
    case 'sync':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5L19 8.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5L5 15.5"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 4.5v4h-4M5 19.5v-4h4" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3.5 5 6.5v5c0 4.5 2.9 7.8 7 9.5 4.1-1.7 7-5 7-9.5v-5l-7-3Z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m9.5 12 1.8 1.8 3.7-3.8" />
        </svg>
      );
  }
}

const PILLARS = [
  {
    title: 'Autopilot na Bazoš a Sbazar',
    body: 'Inzeráty po pár dnech zapadnou. Prodejomat je obnovuje, abyste byli pořád vidět — a zboží se točilo.',
    tag: 'Méně dřiny, víc prodejů',
  },
  {
    title: 'Vlastní e-shop bez další práce',
    body: 'Ze skladu vznikne storefront na vaší doméně. Vlastní kanál a značka — ne jen cizí portál.',
    tag: 'Váš sklad, vaše značka',
  },
  {
    title: 'Jeden sklad, nula chaosu',
    body: 'Prodali jste na Bazoši? Prodejomat stáhne položku z e-shopu i Sbazaru. Žádné dvojprodeje.',
    tag: '0 duplicitních prodejů',
  },
] as const;

function CheckIcon({ className = 'h-4 w-4 text-emerald-500' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChannelIcon({ name }: { name: string }) {
  const className = 'h-3.5 w-3.5 shrink-0';
  switch (name) {
    case 'Bazoš':
      // Oficiální značka Bazoš: oranžové @) na černém pozadí
      return (
        <span className="inline-flex h-3.5 w-[1.15rem] shrink-0 items-center justify-center rounded-[3px] bg-black px-px">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/bazos.png"
            alt=""
            width={16}
            height={12}
            className="h-3 w-[0.95rem] object-contain"
          />
        </span>
      );
    case 'Sbazar':
      // Oficiální značka Sbazar: červené stylizované s
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/brand/sbazar.png"
          alt=""
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0 object-contain"
        />
      );
    case 'E-shop':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#34d399" />
          <path
            d="M7 9h10l-1 8H8L7 9Zm2.5-2.5a2.5 2.5 0 0 1 5 0"
            stroke="#064e3b"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'Google':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
          />
        </svg>
      );
    case 'Seznam':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#CC0000" />
          <path
            fill="#fff"
            d="M7.2 8.2c1.6-1.3 3.8-1.5 5.2-.4.7.6.7 1.5.1 2-.6.5-1.4.4-2-.1-.6-.5-1.5-.5-2.1.1-.5.5-.4 1.3.2 1.7l3.6 2.4c1.8 1.2 1.7 3.7-.3 4.7-1.8 1-4.2.5-5.5-1.1l1.5-1.2c.8 1 2.2 1.2 3.1.7.7-.4.7-1.2.1-1.6L8.1 13c-1.9-1.3-1.8-3.9.1-5.3.3-.2.6-.4 1-.5Z"
          />
        </svg>
      );
    case 'ChatGPT':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#10a37f" />
          <path
            fill="#fff"
            d="M12.4 5.2c.9-.5 2-.5 2.9 0l2.2 1.3c.9.5 1.4 1.4 1.4 2.4v2.5c0 .3-.1.5-.2.7l-2.1-1.2V9c0-.3-.2-.6-.4-.8l-2.2-1.3c-.3-.1-.5-.1-.8 0L10.9 8l-1.3-.8 2.2-1.3c.2-.1.4-.1.6 0Zm-5.6 3c0-.9.5-1.8 1.4-2.3l2.1 1.2-.1.1c-.3.1-.4.4-.4.7v2.5c0 .3.2.6.4.8l2.2 1.3c.2.1.5.1.8 0l2.1-1.2 1.3.8-2.2 1.2c-.9.5-2 .5-2.9 0L8.2 12c-.9-.5-1.4-1.4-1.4-2.4V8.2Zm5.4 8.6c-.3.1-.5.1-.8 0l-2.2-1.3c-.3-.1-.4-.4-.4-.8v-2.4l-1.3-.7v2.4c0 1 .5 1.9 1.4 2.4l2.2 1.3c.9.5 2 .5 2.9 0l2.1-1.2-1.3-.8-2.1 1.2c-.2 0-.4.1-.5.1Zm6.2-3.5c.9-.5 1.4-1.4 1.4-2.4V9.4l-1.3.8v2.5c0 .3-.2.6-.4.8l-2.2 1.3c-.2.1-.5.1-.8 0l-2.1-1.2-1.3.8 2.2 1.2c.9.5 2 .5 2.9 0l2.2-1.3c.3-.1.4-.2.4-.4Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

const CHANNELS = ['Bazoš', 'Sbazar', 'E-shop', 'Google', 'Seznam', 'ChatGPT'] as const;

function SectionEyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={[
        'text-[11px] font-bold uppercase tracking-[0.2em]',
        light ? 'text-emerald-400' : 'text-emerald-600',
      ].join(' ')}
    >
      {children}
    </p>
  );
}

export default function ProdejomatLanding({ user }: ProdejomatLandingProps) {
  const trialHref = '/login?mode=register&trial=1';
  const ctaHref = user ? '/?onboarding=1' : trialHref;
  const ctaText = user ? 'Pokračovat ve zkušební verzi' : 'Vyzkoušet 7 dní zdarma';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f6f7f8] text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950">
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[28rem] w-[min(100vw,48rem)] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-[42rem] -right-32 -z-10 hidden h-[28rem] w-[28rem] rounded-full bg-slate-300/20 blur-3xl sm:block" />

      {/* Hero — header je sdílený Navigation (stejný jako login / app) */}
      <section className="relative mx-auto max-w-5xl px-4 pb-10 pt-10 text-center sm:px-6 sm:pb-16 sm:pt-16 lg:px-8">
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-900 shadow-xs sm:px-4 sm:text-xs">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          7 dní zdarma · bez karty · bez závazku
        </div>

        <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:mt-7 sm:text-5xl sm:leading-[1.08] md:text-6xl">
          Prodáte víc a rychleji.
          <span className="mt-1.5 block bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent sm:mt-2">
            Zboží se točí.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:mt-5 sm:text-lg">
          Máte desítky inzerátů na Bazoši? Jednou naskladníte — Prodejomat obnovuje, topuje
          a prodává na Bazoši, Sbazaru i e-shopu. Vy jen berete poptávky.
        </p>

        <div className="mx-auto mt-7 flex w-full max-w-md flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:max-w-none sm:flex-row sm:items-center sm:gap-3.5">
          <Link
            href={ctaHref}
            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-[15px] font-bold text-slate-950 shadow-[0_12px_28px_-8px_rgba(16,185,129,0.55)] transition hover:bg-emerald-400 active:scale-[0.98] sm:w-auto sm:px-8 sm:text-base sm:hover:scale-[1.02]"
          >
            <span>{ctaText}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="#jak-to-funguje"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] sm:w-auto sm:text-base"
          >
            Jak to funguje
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2 text-xs font-semibold text-slate-500 sm:mt-7 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-2">
          {['Pořád vidět na Bazoši', 'Jednou nahrát, prodat všude', 'Bez peněz předem'].map(
            (item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckIcon />
                {item}
              </span>
            )
          )}
        </div>
      </section>

      {/* Flow diagram */}
      <section
        id="jak-to-funguje"
        className="relative mx-auto max-w-5xl scroll-mt-6 px-3 pb-12 sm:px-6 sm:pb-20 lg:px-8"
        aria-label="Jak Prodejomat funguje"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a1a] via-slate-950 to-black px-4 py-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-[2rem] sm:px-12 sm:py-12">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent sm:inset-x-16" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl sm:h-64" />

          <div className="relative mx-auto max-w-xl px-1 text-center">
            <SectionEyebrow light>Takto jednoduché to je</SectionEyebrow>
            <p className="mt-2 text-lg font-bold tracking-tight text-white sm:text-2xl">
              Jednou nahrát → prodat všude
            </p>
          </div>

          <div className="relative mx-auto mt-7 grid max-w-4xl grid-cols-1 items-stretch gap-2 sm:mt-12 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center sm:gap-3 lg:gap-5">
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center sm:min-h-[17.5rem] sm:justify-between sm:px-5 sm:py-7">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-black sm:h-9 sm:w-9">
                  1
                </span>
                <p className="mt-2.5 text-sm font-bold text-white sm:mt-3 sm:text-[15px]">Nahrajete zboží</p>
              </div>
              <div className="my-3.5 w-full max-w-[14rem] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left sm:my-5 sm:max-w-[12.5rem] sm:py-3.5">
                <p className="text-sm font-semibold text-white">Zimní pneu 205/55</p>
                <p className="mt-1 text-sm font-bold text-emerald-400">3 800 Kč</p>
              </div>
              <p className="text-xs font-medium text-slate-400">Jednou do skladu</p>
            </div>

            <div className="flex h-5 items-center justify-center text-emerald-400 sm:h-auto" aria-hidden>
              <span className="text-xl font-light leading-none rotate-90 sm:rotate-0 sm:text-2xl">→</span>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-5 text-center shadow-[0_0_40px_-12px_rgba(52,211,153,0.45)] ring-1 ring-emerald-400/15 sm:min-h-[17.5rem] sm:justify-between sm:px-5 sm:py-7">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-sm font-black text-black shadow-[0_0_24px_rgba(52,211,153,0.55)] sm:h-9 sm:w-9">
                  2
                </span>
                <p className="mt-2.5 text-sm font-bold text-white sm:mt-3 sm:text-[15px]">
                  Prodejomat to rozjede
                </p>
              </div>
              <div className="my-3.5 flex w-full max-w-[14rem] flex-col gap-1.5 sm:my-5 sm:max-w-[12.5rem] sm:gap-2">
                {['vystaví inzeráty', 'obnovuje je samo', 'stáhne po prodeji'].map((line) => (
                  <p
                    key={line}
                    className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-center text-[13px] font-semibold text-emerald-100 sm:text-sm"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <p className="text-xs font-medium text-emerald-300/80">Bez ruční dřiny</p>
            </div>

            <div className="flex h-5 items-center justify-center text-emerald-400 sm:h-auto" aria-hidden>
              <span className="text-xl font-light leading-none rotate-90 sm:rotate-0 sm:text-2xl">→</span>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-center sm:min-h-[17.5rem] sm:justify-between sm:px-5 sm:py-7">
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-black text-black sm:h-9 sm:w-9">
                  3
                </span>
                <p className="mt-2.5 text-sm font-bold text-white sm:mt-3 sm:text-[15px]">Prodáváte všude</p>
              </div>
              <div className="my-3.5 grid w-full max-w-[16rem] grid-cols-2 gap-1.5 sm:my-5 sm:max-w-[14rem]">
                {CHANNELS.map((channel) => (
                  <div
                    key={channel}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-[11px] font-semibold text-white sm:text-[12px]"
                  >
                    <ChannelIcon name={channel} />
                    <span className="truncate">{channel}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-slate-400">Vy jen berete poptávky</p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study — Duplux (Alu Bazar Plzeň) Infografika */}
      <section
        id="ukazka"
        className="relative mx-auto max-w-5xl scroll-mt-8 px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8"
        aria-label="Případová studie klienta Duplux"
      >
        {/* Horní hlavička */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Reálná ukázka z praxe · Klient Duplux
          </div>
          <h2 className="mt-3 text-[1.65rem] font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            1× nahrát u nás → okamžitě všude
          </h2>
          <p className="mt-2 text-[15px] text-slate-600 sm:mt-3 sm:text-base">
            Podívejte se na konkrétní sadu disků našeho klienta <strong className="font-semibold text-slate-900">Duplux (Alu Bazar Plzeň)</strong>. Prodejce nahrál kola do Prodejomatu – a systém je sám rozeslal na Bazoš, Sbazar i na jeho vlastní e-shop.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium border border-slate-200 shadow-2xs">
              📍 Pneuservis &amp; Alu kola, Plzeň
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-medium border border-slate-200 shadow-2xs">
              📦 800+ aktivních inzerátů
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs">
              ⚡ 0 min ručního přepisování
            </span>
          </div>
        </div>

        {/* Infografika kontejner */}
        <div className="mt-8 space-y-6 sm:mt-12">
          {/* KROK 1: Vstup — Nahraný inzerát v Prodejomatu */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">
                  1
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wide text-slate-950 sm:text-sm">
                      Centrální sklad Prodejomat
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Zdroj pravdy
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Prodejce Duplux vložil inzerát pouze jednou do aplikace</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-mono text-[11px] text-slate-600">
                  ID položky: #46732
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                  ✓ Naskladněno
                </span>
              </div>
            </div>

            {/* Náhled inzerátu v Prodejomatu */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-12 md:items-center">
              {/* Fotografie */}
              <div className="md:col-span-5 space-y-2">
                <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-2xs">
                  <img
                    src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025511498_7nqrfjq.jpg"
                    alt="Alu disky Volkswagen Transporter T6, 18 palců"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-2 left-2 rounded-lg bg-slate-950/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                    Fotka z terénu · Duplux Plzeň
                  </span>
                </div>
                {/* Miniatury dalších fotek */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-4/3 overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100">
                    <img
                      src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025514188_qckuos5.jpg"
                      alt="Detail disku 2"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="aspect-4/3 overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100">
                    <img
                      src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025516763_ohezxy0.jpg"
                      alt="Detail disku 3"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="aspect-4/3 overflow-hidden rounded-lg border border-slate-200/60 bg-slate-100">
                    <img
                      src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025519206_fsoqqnn.jpg"
                      alt="Detail disku 4"
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>

              {/* Data inzerátu */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      Hliníková kola / Disky
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Sklad: Plzeň
                    </span>
                  </div>

                  <h3 className="mt-2 text-lg font-bold text-slate-950 sm:text-xl">
                    Alu disky na Volkswagen Transporter T6, 18&quot;, 5x120, ET 35
                  </h3>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-950">10 000 Kč</span>
                    <span className="text-xs font-semibold text-slate-500">za celou sadu</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-600">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                      R18
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                      Rozteč: 5x120
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                      ET: 35
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                      Šíře: 8J
                    </span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">
                      Střed: 65,1 mm
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-xs font-bold text-emerald-950">
                        Autopilot Prodejomatu aktivní
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800">
                      Automatický export spuštěn
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-800/80">
                    Po uložení položky systém okamžitě publikoval inzerát do 3 prodejních kanálů a hlídá jeho obnovu.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vizuální infografická spojka */}
          <div className="relative py-2 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-dashed border-slate-300" />
            </div>
            <div className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-slate-800 shadow-xs">
              <span className="text-emerald-500 font-bold">⚡</span>
              <span>Automatický rozpad do 3 kanálů současně</span>
              <span className="text-slate-400">↓</span>
            </div>
          </div>

          {/* KROK 2: Výstup — 3 reálné cílové kanály */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {/* Kanál 1: Bazoš.cz */}
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {/* Hlavička kanálu stylizovaná pro Bazoš */}
              <div className="border-b border-slate-100 bg-[#f4f7fb] px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#1e4e8c] text-[10px] font-black text-white">
                      B
                    </span>
                    <span className="text-xs font-bold text-[#1e4e8c]">Bazoš.cz</span>
                    <span className="text-[10px] font-medium text-slate-400">/ auto</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Aktivní online
                  </span>
                </div>
              </div>

              {/* Náhled inzerátu na Bazoši */}
              <div className="p-4 space-y-3">
                <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                  <img
                    src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025511498_7nqrfjq.jpg"
                    alt="Bazoš náhled"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 rounded bg-[#1e4e8c] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    TOP / TOPUJEME
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Inzerát č. 226628735</p>
                  <h4 className="mt-0.5 text-sm font-bold text-slate-900 line-clamp-2">
                    Alu disky na Volkswagen Transporter T6, 18&quot;, 5x120, ET 35
                  </h4>
                  <p className="mt-1 text-base font-extrabold text-[#1e4e8c]">10 000 Kč</p>
                  <p className="mt-1 text-[11px] text-slate-500">Lokalita: Plzeň · Prodejce: Vašek</p>
                </div>
              </div>

              {/* Spodní badge autopilotu */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-700">
                <span className="text-emerald-600 font-bold">✓ Autopilot:</span> Automatická obnova inzerátu drží nabídku nahoře bez ručního klikání.
              </div>
            </div>

            {/* Kanál 2: Sbazar.cz */}
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {/* Hlavička kanálu stylizovaná pro Sbazar */}
              <div className="border-b border-slate-100 bg-[#fdf5f5] px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#cc0000] text-[10px] font-black text-white">
                      S
                    </span>
                    <span className="text-xs font-bold text-[#cc0000]">Sbazar.cz</span>
                    <span className="text-[10px] font-medium text-slate-400">/ Seznam</span>
                  </div>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    Aktivní online
                  </span>
                </div>
              </div>

              {/* Náhled inzerátu na Sbazaru */}
              <div className="p-4 space-y-3">
                <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                  <img
                    src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025511498_7nqrfjq.jpg"
                    alt="Sbazar náhled"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 right-2 rounded bg-[#cc0000] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Seznam ověřeno
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-400">Inzerát č. 235990857</p>
                  <h4 className="mt-0.5 text-sm font-bold text-slate-900 line-clamp-2">
                    Alu disky na Volkswagen Transporter T6, 18&quot;, 5x120
                  </h4>
                  <p className="mt-1 text-base font-extrabold text-[#cc0000]">10 000 Kč</p>
                  <p className="mt-1 text-[11px] text-slate-500">Plzeň-město · Zboží k vyzvednutí</p>
                </div>
              </div>

              {/* Spodní badge autopilotu */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-700">
                <span className="text-emerald-600 font-bold">✓ Seznam.cz:</span> Inzerát se sám synchronizuje ze stejného skladu. Žádné dvojí vyplňování.
              </div>
            </div>

            {/* Kanál 3: Vlastní E-shop */}
            <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs sm:col-span-2 lg:col-span-1">
              {/* Hlavička kanálu pro Vlastní e-shop */}
              <div className="border-b border-slate-100 bg-slate-900 px-4 py-2.5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-[10px] font-black text-slate-950">
                      🛒
                    </span>
                    <span className="text-xs font-bold text-white">Vlastní E-shop</span>
                    <span className="text-[10px] font-medium text-slate-400">alubazarplzen.cz</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Skladem v e-shopu
                  </span>
                </div>
              </div>

              {/* Náhled na e-shopu */}
              <div className="p-4 space-y-3">
                <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                  <img
                    src="https://pub-d4238224a90a49f98bf05b686985171f.r2.dev/offers/1795025511498_7nqrfjq.jpg"
                    alt="E-shop náhled"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Osobní odběr Plzeň
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-emerald-600">Alu Bazar Plzeň Storefront</p>
                  <h4 className="mt-0.5 text-sm font-bold text-slate-900 line-clamp-2">
                    Sada alu kol VW Transporter T5/T6 R18 5x120
                  </h4>
                  <div className="mt-1 flex items-baseline justify-between">
                    <p className="text-base font-extrabold text-slate-950">10 000 Kč</p>
                    <span className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                      Rezervovat
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Možnost přezutí a vyvážení na místě</p>
                </div>
              </div>

              {/* Spodní badge autopilotu */}
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-700">
                <span className="text-emerald-600 font-bold">✓ Vlastní storefront:</span> Žádné provize portálům. Zákazník nakupuje přímo u vás.
              </div>
            </div>
          </div>

          {/* KROK 3: Co se stane při prodeji? (Magická synchronizace) */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-black text-slate-950">
                    ✓
                  </span>
                  <p className="text-sm font-bold text-white sm:text-base">
                    Co se stane, když se kola prodají?
                  </p>
                </div>
                <p className="text-xs text-slate-300 sm:text-sm">
                  Kupující zavolá z Bazoše a odveze si je. Duplux v mobilu klikne na <span className="font-semibold text-emerald-400">„Prodáno“</span> — a Prodejomat do minuty stáhne nabídku z Bazoše, Sbazaru i e-shopu.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-emerald-300 backdrop-blur-xs">
                <span>🛡️</span>
                <span>0 duplicitních prodejů</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain → killer */}
      <section
        id="vysledek"
        className="relative mx-auto max-w-5xl scroll-mt-6 px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Pro bazary, autodíly, pneu, elektroniku</SectionEyebrow>
          <h2 className="mt-2 text-[1.65rem] font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Prodejomat řeší reálné problémy prodejců.
          </h2>
          <p className="mt-2 text-[15px] text-slate-600 sm:mt-3 sm:text-base">
            Ne další marketing. Konkrétní věci, které vás denně brzdí — zvlášť když máte desítky
            inzerátů.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
          {PAINS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.12)] sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-[11px] font-semibold uppercase leading-snug tracking-wide text-slate-400 sm:text-xs">
                  {item.pain}
                </p>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 sm:h-10 sm:w-10">
                  <PainIcon name={item.icon} />
                </span>
              </div>
              <p className="mt-2.5 text-base font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-lg">
                {item.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 sm:mt-2">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section
        id="funkce"
        className="relative mx-auto max-w-5xl scroll-mt-6 px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Co dostanete</SectionEyebrow>
          <h2 className="mt-2 text-[1.65rem] font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Vše, co prodejce potřebuje.
          </h2>
          <p className="mt-2 text-[15px] text-slate-600 sm:mt-3 sm:text-base">Nic navíc. Žádný chaos.</p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
          {PILLARS.map((item, index) => (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.12)] sm:p-7"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight text-slate-950 sm:mt-5 sm:text-lg">
                {item.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
              <p className="mt-4 text-xs font-bold text-emerald-700 sm:mt-5">{item.tag}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section
        id="cenik"
        className="relative mx-auto max-w-5xl scroll-mt-6 px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Ceník</SectionEyebrow>
          <h2 className="mt-2 text-[1.65rem] font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Míň než jeden ušlý prodej.
            <span className="mt-1 block text-emerald-600">Celý měsíc na autopilotu.</span>
          </h2>
          <p className="mt-2 text-[15px] text-slate-600 sm:mt-3 sm:text-base">
            Nejdřív 7 dní zkušební zdarma. Ceník platí až když uvidíte, že se točí.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 sm:mt-10 lg:grid-cols-3">
          {PRICING.map((plan) => (
            <div
              key={plan.id}
              className={[
                'relative flex flex-col rounded-2xl border p-6 pt-7 sm:p-8',
                plan.highlighted
                  ? 'order-first border-emerald-400/30 bg-gradient-to-b from-[#1a1a1a] via-slate-950 to-black text-white shadow-[0_28px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-emerald-400/20 lg:order-none lg:-translate-y-1'
                  : 'border-slate-200/80 bg-white shadow-[0_12px_32px_-18px_rgba(15,23,42,0.12)]',
                plan.id === 'start' ? 'lg:order-none' : '',
                plan.id === 'firma' ? 'order-last lg:order-none' : '',
              ].join(' ')}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-bold text-slate-950">
                  Zkušební + nejčastější volba
                </span>
              )}

              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3
                  className={[
                    'text-lg font-bold tracking-tight',
                    plan.highlighted ? 'text-white' : 'text-slate-950',
                  ].join(' ')}
                >
                  {plan.name}
                </h3>
                <span className="text-xs font-semibold text-slate-400">{plan.hint}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-1.5 sm:mt-4">
                <span
                  className={[
                    'text-[2.35rem] font-black tracking-tight sm:text-4xl',
                    plan.highlighted ? 'text-white' : 'text-slate-950',
                  ].join(' ')}
                >
                  {plan.price}
                </span>
                <span
                  className={[
                    'mb-1 text-sm font-semibold',
                    plan.highlighted ? 'text-slate-400' : 'text-slate-500',
                  ].join(' ')}
                >
                  Kč / měsíc
                </span>
              </div>

              <p
                className={[
                  'mt-3 text-sm leading-relaxed',
                  plan.highlighted ? 'text-slate-300' : 'text-slate-600',
                ].join(' ')}
              >
                {plan.description}
              </p>

              <ul className="mt-5 flex-1 space-y-2.5 sm:mt-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={[
                      'flex items-start gap-2 text-sm',
                      plan.highlighted ? 'text-slate-200' : 'text-slate-700',
                    ].join(' ')}
                  >
                    <CheckIcon
                      className={[
                        'mt-0.5 h-4 w-4 shrink-0',
                        plan.highlighted ? 'text-emerald-400' : 'text-emerald-500',
                      ].join(' ')}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={user ? ctaHref : `${trialHref}&plan=${plan.id}`}
                className={[
                  'mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-bold transition active:scale-[0.98] sm:mt-8',
                  plan.highlighted
                    ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                    : 'border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50',
                ].join(' ')}
              >
                {user ? 'Pokračovat ve zkušební verzi' : `Zkušební 7 dní · ${plan.name}`}
              </Link>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-xl px-1 text-center text-sm leading-relaxed text-slate-500 sm:mt-8">
          Zkušební verze je zdarma. Setup migrace skladu řešíme až po aktivaci — a jen když dává smysl.
        </p>
      </section>

      {/* Trust + FAQ */}
      <section
        id="faq"
        className="relative mx-auto max-w-5xl scroll-mt-6 px-4 pb-12 sm:px-6 sm:pb-20 lg:px-8"
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.12)] sm:p-8">
            <SectionEyebrow>Proč nám věřit</SectionEyebrow>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
              Stavíme to pro prodejce s reálným objemem.
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Autopilot obnovy a multi-kanál z jednoho skladu — Bazoš, Sbazar, e-shop.
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Zkušební 7 dní bez karty. Nejdřív uvidíte poptávky, pak řešíme plán.
              </li>
              <li className="flex gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Stavíme to s prodejci z terénu — pneu, autodíly, vrakoviště. Ne z PowerPointu.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#kontakt"
                className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-800 transition hover:bg-white"
              >
                Kontakt &amp; Provozovatel
              </a>
              <a
                href="mailto:info@prodejomat.cz"
                className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-800 transition hover:bg-white"
              >
                info@prodejomat.cz
              </a>
              <Link
                href={trialHref}
                className="inline-flex min-h-10 items-center rounded-full bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                Spustit zkušební verzi
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_12px_32px_-18px_rgba(15,23,42,0.35)] sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">FAQ</p>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="font-bold text-white">Musím platit hned?</p>
                <p className="mt-1 text-slate-400">Ne. 7 dní zkušební zdarma, bez karty.</p>
              </div>
              <div>
                <p className="font-bold text-white">Funguje to i při 50+ inzerátech?</p>
                <p className="mt-1 text-slate-400">
                  Ano — právě tam šetří nejvíc času na obnovách a přepisování.
                </p>
              </div>
              <div>
                <p className="font-bold text-white">Co když to nebude sedět?</p>
                <p className="mt-1 text-slate-400">
                  Po zkušební verzi nic neplatíte. Setup migrace řešíme jen když pokračujete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-5xl px-3 pb-12 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#1a1a1a] via-slate-950 to-black px-5 py-10 text-center text-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-[2rem] sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent sm:inset-x-16" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[min(100%,24rem)] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl sm:h-48 sm:w-96" />

          <div className="relative mx-auto max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400">
              7 dní zdarma
            </p>
            <h2 className="mt-2 text-[1.65rem] font-extrabold tracking-tight sm:text-4xl">
              Nahrajte jednou. Prodávejte všude.
            </h2>
            <p className="mt-3 text-[15px] text-slate-300 sm:text-base">
              Bez karty. Bez závazku. Nejdřív uvidíte obnovy a poptávky.
            </p>
            <Link
              href={ctaHref}
              className="group mt-7 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-emerald-400 px-8 py-3.5 text-[15px] font-bold text-slate-950 transition hover:bg-emerald-300 active:scale-[0.98] sm:mt-8 sm:w-auto sm:text-base sm:hover:scale-[1.02]"
            >
              <span>{ctaText}</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* O autorech, Ekosystém & Kontakt */}
      <section
        id="kontakt"
        className="relative mx-auto max-w-5xl scroll-mt-8 px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8"
      >
        {/* Nadpis sekce s prostorem a lehkostí */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Zázemí &amp; Ekosystém
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
            Od tvůrců platforem{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Mai.cz
            </span>{' '}
            a{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
              LicenceX.cz
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Projekt vyvíjí a provozuje česká společnost <strong className="font-semibold text-slate-900">Mai Digital s.r.o.</strong> se sídlem v Praze. Stavíme spolehlivý software, automatizace a e-commerce nástroje pro moderní prodejce.
          </p>
        </div>

        {/* 2 výrazné, fluidní karty pro Mai.cz a LicenceX.cz */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          {/* Karta 1: Mai.cz */}
          <a
            href="https://mai.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-8"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-base font-black text-white shadow-xs transition-transform group-hover:scale-105">
                  M
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition group-hover:bg-slate-100">
                  <span>mai.cz</span>
                  <span className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mateřská platforma
                </span>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 group-hover:text-emerald-600 transition-colors">
                  Mai.cz
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Centrální technologická platforma, digitální produkty a vývoj softwaru se stabilní cloudovou infrastrukturou.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                ⚡ Cloud &amp; Software
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                🔒 Vlastní infrastruktura
              </span>
            </div>
          </a>

          {/* Karta 2: LicenceX.cz */}
          <a
            href="https://licencex.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md sm:p-8"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-base font-black text-white shadow-xs transition-transform group-hover:scale-105">
                  LX
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 transition group-hover:bg-emerald-100">
                  <span>licencex.cz</span>
                  <span className="text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                  E-commerce &amp; Licence
                </span>
                <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 group-hover:text-emerald-600 transition-colors">
                  LicenceX.cz
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Specializovaný e-shop pro software, digitální licence a cloudové nástroje s automatickým okamžitým doručením.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                🛒 E-shop platforma
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                ✓ Tisíce zákazníků
              </span>
            </div>
          </a>
        </div>

        {/* Široká, čistá karta: Společnost Mai Digital s.r.o. + Přímý kontakt */}
        <div className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10 items-center">
            {/* Levá část: Firemní údaje */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Mai Digital s.r.o.</h3>
                  <p className="text-xs text-slate-500">Česká technologická společnost · Zapsána 22. 11. 2025 v Praze</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono font-medium text-slate-800">
                  <span className="text-slate-400 font-sans">IČO:</span> 23980851
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono font-medium text-slate-800">
                  <span className="text-slate-400 font-sans">DIČ:</span> CZ23980851
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-700">
                  📍 Školská 660/3, Praha 1
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-500">
                  ⚖️ Městský soud v Praze
                </span>
              </div>
            </div>

            {/* Pravá část: Rychlý kontakt a podpora */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 rounded-2xl bg-slate-50/80 p-4 sm:p-5 border border-slate-100">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-950">Máte dotaz nebo zájem o onboarding?</p>
                <p className="text-xs text-slate-500">Rádi pomůžeme se setupem skladu i kanálů.</p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Podpora Po–Pá 8:30–17:30</span>
                </div>
              </div>

              <a
                href="mailto:info@prodejomat.cz"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95"
              >
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>info@prodejomat.cz</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-950 text-xs font-black text-white">
              P
            </span>
            <span className="text-sm font-black tracking-tight text-slate-950">
              Prodej<span className="text-emerald-600">omat</span>
              <span className="text-[10px] font-bold text-slate-400">.cz</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              by <span className="font-semibold text-slate-700">Mai Digital s.r.o.</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <Link href="#jak-to-funguje" className="transition hover:text-slate-950">
              Jak to funguje
            </Link>
            <Link href="#ukazka" className="transition hover:text-slate-950">
              Ukázka
            </Link>
            <Link href="#cenik" className="transition hover:text-slate-950">
              Ceník
            </Link>
            <Link href="#faq" className="transition hover:text-slate-950">
              FAQ
            </Link>
            <Link href="#kontakt" className="transition hover:text-slate-950">
              Kontakt
            </Link>
            <Link href="/login" className="transition hover:text-slate-950">
              Přihlášení
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 py-4 px-4 text-center text-[11px] text-slate-400">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1.5 sm:flex-row">
            <span>© {new Date().getFullYear()} Prodejomat.cz &amp; Sellin.cz · Všechna práva vyhrazena.</span>
            <span>IČO: 23980851 · DIČ: CZ23980851 · Školská 660/3, Praha 1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
