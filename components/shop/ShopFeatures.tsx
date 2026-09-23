'use client';

import Link from 'next/link';
import { useShop } from './ShopContext';

export default function ShopFeatures() {
  const { phone, phoneHref, addressLine } = useShop();
  const steps = [
    {
      num: '01',
      title: 'Vyberte v nabídce',
      desc: 'Zvolte rozměr pneu nebo rozteč disků podle velkého technického průkazu vašeho vozu v katalogu výše.',
      tag: 'Katalog',
    },
    {
      num: '02',
      title: 'Zavolejte nám',
      desc: (
        <>
          Na čísle{' '}
          <a
            href={`tel:${phoneHref}`}
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-block"
          >
            {phone}
          </a>{' '}
          vám ihned potvrdíme dostupnost, stav i detaily a položku vám zarezervujeme bez zálohy.
        </>
      ),
      tag: 'Rezervace',
    },
    {
      num: '03',
      title: 'Osobní odběr / Pošta',
      desc: `Přijeďte si zboží prohlédnout do lokality ${addressLine || 'naší provozovny'} s možností okamžitého obutí, nebo vám sadu pošleme poštou.`,
      tag: 'Převzetí',
    },
  ];

  const features = [
    {
      title: 'Ručně měřený dezén',
      desc: 'U každé pneumatiky měříme vzorek kalibrovaným hloubkoměrem. V inzerátech uvádíme přesné milimetry bez přikrášlování.',
      icon: (
        <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      title: '100% reálné fotografie',
      desc: 'Fotografujeme konkrétní kusy, které máme fyzicky skladem. Žádné stažené ilustrační fotky z internetu nebo katalogů.',
      icon: (
        <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: addressLine ? `Osobní prohlídka (${addressLine})` : 'Osobní prohlídka na provozovně',
      desc: 'Před zaplacením si kola nebo pneu osobně prohlédnete a zkontrolujete. Nic nekupujete naslepo ani bez záruky.',
      icon: (
        <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: 'Přezutí a servis na místě',
      desc: 'Vybrané pneumatiky vám rovnou na místě odborně obujeme na disky, vyvážíme a namontujeme na auto po domluvě.',
      icon: (
        <svg className="h-5 w-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" />
        </svg>
      ),
    },
  ];

  return (
    <section id="jak-nakoupit" className="scroll-mt-20 sm:scroll-mt-24 border-b border-slate-200/90 bg-white py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Férový přístup & rychlý nákup
          </span>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Jak u nás nakoupíte a proč právě u nás?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Žádné zdlouhavé e-shopové formuláře ani nákup zajíce v pytli. U nás přesně víte, co kupujete, a vše si můžete předem zkontrolovat.
          </p>
        </div>

        {/* Part 1: 3 Steps to Purchase */}
        <div className="mt-8 sm:mt-12">
          <div className="grid gap-3.5 sm:gap-6 sm:grid-cols-3">
            {steps.map((item, index) => (
              <div
                key={item.num}
                className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-6 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white font-black text-sm shadow-xs">
                    {item.num}
                  </span>
                  <span className="rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                    {item.tag}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {item.desc}
                </p>

                {/* Subtle desktop connector arrow */}
                {index < 2 && (
                  <div
                    className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 shadow-2xs"
                    aria-hidden="true"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: 4 Trust Pillars (Guarantees) */}
        <div className="mt-10 sm:mt-14 pt-8 sm:pt-12 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Naše garance
              </p>
              <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 mt-0.5">
                4 důvody, proč si zákazníci vybírají nás
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Kola pečlivě kontrolujeme, prověřujeme rovnost na vyvažovačce a ručně měříme reálný stav.
            </p>
          </div>

          <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  {feature.icon}
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-950">
                  {feature.title}
                </h4>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Fast Action Strip */}
        <div className="mt-8 sm:mt-10 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-sm text-slate-950">
              Nevíte si rady se značením pneu nebo roztečí kol?
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Rádi vám ověříme kompatibilitu podle velkého technického průkazu.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <Link
              href="/shop/jak-nakoupit"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline px-2 py-1.5"
            >
              <span>Jak vybrat pneu (průvodce)</span>
              <span>→</span>
            </Link>

            <a
              href={`tel:${phoneHref}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[hsl(142_71%_45%)] hover:bg-[hsl(142_71%_35%)] text-white px-3.5 py-2 text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Zavolat {phone}</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
