'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface TrialOnboardingChecklistProps {
  hasPairedAccounts: boolean;
  hasOffers: boolean;
  compact?: boolean;
}

const STEPS = [
  {
    id: 'bazos',
    title: '1. Propojte svůj Bazoš',
    body: 'Stačí zadat telefonní číslo a opsat kód z SMSky. Trvá to necelou minutu.',
    href: '/accounts?open=bazos',
    cta: '⚡ Propojit Bazoš přes SMS',
  },
  {
    id: 'offer',
    title: '2. Vložte první inzerát',
    body: 'Vyfoťte zboží, zadejte cenu a my nabídku okamžitě vystavíme.',
    href: '/create',
    cta: '🚀 Vložit první inzerát',
  },
  {
    id: 'renew',
    title: '3. Automatické obnovování',
    body: 'Inzeráty se samy posouvají na první pozice, aby nezapadly a rychle se prodaly.',
    href: '/accounts',
    cta: 'Zkontrolovat kanály',
  },
] as const;

export default function TrialOnboardingChecklist({
  hasPairedAccounts,
  hasOffers,
  compact = false,
}: TrialOnboardingChecklistProps) {
  // Postup: nejprve Bazoš (index 0), pak inzerát (index 1), pak automatika (index 2)
  const activeStep = !hasPairedAccounts ? 0 : !hasOffers ? 1 : 2;
  const isAllDone = hasPairedAccounts && hasOffers;

  return (
    <div
      className={[
        'rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white shadow-[0_16px_40px_-12px_rgba(16,185,129,0.14),0_2px_10px_rgba(15,23,42,0.02)] ring-1 ring-emerald-900/[0.04]',
        compact ? 'p-5' : 'p-6 sm:p-7',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Rychlý start prodejce
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-500">
              {isAllDone ? 'Vše připraveno' : `Krok ${activeStep + 1} ze 3`}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            {isAllDone
              ? '🎉 Skvělá práce, váš prodej běží naplno!'
              : !hasPairedAccounts
              ? 'Začněte Bazošem – nejrychlejší prodej v ČR'
              : 'Skvěle! Bazoš je aktivní, teď vložte první inzerát'}
          </h3>
          <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm leading-relaxed">
            {isAllDone
              ? 'Bazoš máte napojený a inzeráty se automaticky udržují na prvních místech.'
              : !hasPairedAccounts
              ? 'Nepotřebujete žádné technické znalosti. Zadáte telefon, opíšete kód z SMSky a můžete ihned vystavovat.'
              : 'Stačí pár kliknutí a inzerát se sám nahraje na Bazoš a další vybrané kanály.'}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Bez karty · zkušební doba
        </span>
      </div>

      <ol className={`mt-5 grid gap-3 ${compact ? '' : 'sm:grid-cols-3'}`}>
        {STEPS.map((step, index) => {
          const done =
            (step.id === 'bazos' && hasPairedAccounts) ||
            (step.id === 'offer' && hasOffers) ||
            (step.id === 'renew' && isAllDone);
          const current = index === activeStep && !done;

          return (
            <li
              key={step.id}
              className={[
                'flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200',
                done
                  ? 'border-emerald-200 bg-emerald-50/60 shadow-2xs'
                  : current
                    ? 'border-slate-950 bg-slate-950 text-white shadow-md ring-2 ring-emerald-500/30'
                    : 'border-slate-200/90 bg-white/80 opacity-80',
              ].join(' ')}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black',
                      done
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : current
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  {done && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Hotovo
                    </span>
                  )}
                  {current && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                      Teď proveďte
                    </span>
                  )}
                </div>
                <h4 className={`mt-3 text-sm font-bold ${current ? 'text-white' : 'text-slate-950'}`}>
                  {step.title}
                </h4>
                <p className={`mt-1.5 text-xs leading-relaxed ${current ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.body}
                </p>
              </div>

              <div className="pt-4">
                {!done ? (
                  <Link
                    href={step.href}
                    onClick={() =>
                      trackEvent('onboarding_step_click', { step: step.id, active: current })
                    }
                    className={[
                      'inline-flex w-full min-h-10 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98]',
                      current
                        ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {step.cta}
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 pt-1">
                    <span>✓</span>
                    <span>Aktivní & nastaveno</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
