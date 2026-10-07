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
    title: 'Napojte Bazoš',
    body: 'Účet a přihlašovací údaje — bez toho nejde vystavit ani obnovovat.',
    href: '/accounts',
    cta: 'Otevřít napojení',
  },
  {
    id: 'renew',
    title: 'Zapněte auto-obnovu',
    body: 'U nabídek nastavte obnovu, ať inzeráty nezapadnou.',
    href: '/accounts',
    cta: 'Nastavit kanály',
  },
  {
    id: 'offer',
    title: 'Vytvořte první inzerát',
    body: 'Jednou naskladníte — Prodejomat to propíše ven.',
    href: '/create',
    cta: 'Nový inzerát',
  },
] as const;

export default function TrialOnboardingChecklist({
  hasPairedAccounts,
  hasOffers,
  compact = false,
}: TrialOnboardingChecklistProps) {
  const activeStep = !hasPairedAccounts ? 0 : !hasOffers ? 2 : 1;

  return (
    <div
      className={[
        'rounded-3xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/90 to-white shadow-[0_16px_40px_-12px_rgba(16,185,129,0.12),0_2px_10px_rgba(15,23,42,0.02)] ring-1 ring-emerald-900/[0.03]',
        compact ? 'p-5' : 'p-6 sm:p-8',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Zkušební · 7 dní
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            Spusťte hodnotu dnes
          </h3>
          <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm">
            Po cold callu / zkušební verzi stačí 3 kroky. Nejdřív Bazoš — pak obnova a první nabídka.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Bez karty · bez závazku
        </span>
      </div>

      <ol className={`mt-5 grid gap-2.5 ${compact ? '' : 'sm:grid-cols-3'}`}>
        {STEPS.map((step, index) => {
          const done =
            (step.id === 'bazos' && hasPairedAccounts) ||
            (step.id === 'offer' && hasOffers) ||
            (step.id === 'renew' && hasPairedAccounts && hasOffers);
          const current = index === activeStep && !done;

          return (
            <li
              key={step.id}
              className={[
                'flex flex-col rounded-2xl border p-4 transition',
                done
                  ? 'border-emerald-200/80 bg-emerald-50/50'
                  : current
                    ? 'border-slate-900 bg-slate-950 text-white shadow-xs'
                    : 'border-slate-200/90 bg-white',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black',
                    done
                      ? 'bg-emerald-500 text-white'
                      : current
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                >
                  {done ? '✓' : index + 1}
                </span>
                <p className={`text-sm font-bold ${current ? 'text-white' : 'text-slate-950'}`}>
                  {step.title}
                </p>
              </div>
              <p className={`mt-2 flex-1 text-xs leading-relaxed ${current ? 'text-slate-300' : 'text-slate-500'}`}>
                {step.body}
              </p>
              {!done && (
                <Link
                  href={step.href}
                  onClick={() =>
                    trackEvent('onboarding_step_click', { step: step.id, active: current })
                  }
                  className={[
                    'mt-3 inline-flex min-h-10 items-center justify-center rounded-xl px-3 py-2 text-xs font-bold transition active:scale-[0.98]',
                    current
                      ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {step.cta}
                </Link>
              )}
              {done && (
                <p className="mt-3 text-[11px] font-bold text-emerald-700">Hotovo</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
