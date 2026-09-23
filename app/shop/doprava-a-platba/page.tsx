'use client';

import Link from 'next/link';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopFooter from '@/components/shop/ShopFooter';
import { useShop } from '@/components/shop/ShopContext';

export default function DopravaAPlatbaPage() {
  const {
    addressLine,
    addressCity,
    hours,
    phone,
    phoneHref,
    shippingPriceTires,
    shippingPriceRims,
  } = useShop();

  const pickupLocation = addressLine
    ? `${addressLine}${addressCity ? `, ${addressCity}` : ''}`
    : 'na naší provozovně';

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-[hsl(215_16%_47%)]">
          <Link href="/shop" className="hover:text-[hsl(222_47%_11%)]">
            E-shop
          </Link>
          <span>/</span>
          <span className="font-medium text-[hsl(222_47%_11%)]">Doprava a platba</span>
        </nav>

        {/* Page Header */}
        <div className="border-b border-[hsl(214_32%_91%)] pb-6 sm:pb-8">
          <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
            Informace o doručení
          </span>
          <h1 className="mt-2.5 sm:mt-3 text-2xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-4xl">
            Doprava a možnosti platby
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-[hsl(215_16%_47%)]">
            Kola a pneumatiky si můžete osobně vyzvednout {pickupLocation}, nebo vám je pečlivě zabalené pošleme poštou.
          </p>
        </div>

        {/* Delivery Options */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-lg font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Způsoby převzetí a dopravy
          </h2>

          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2">
            {/* Option 1: Personal Pickup */}
            <div className="rounded-2xl border-2 border-[hsl(142_71%_45%)] bg-[hsl(142_71%_45%/0.03)] p-4 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[hsl(142_71%_45%)] px-2.5 py-1 text-xs font-bold text-white">
                  DOPORUČUJEME
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[hsl(142_71%_35%)]">
                  ZDARMA
                </span>
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-[hsl(222_47%_11%)]">
                Osobní odběr na provozovně
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                {pickupLocation}
              </p>
              <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-[hsl(222_20%_28%)]">
                <li className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Osobní kontrola dezénu před zaplacením</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Možnost okamžitého obutí na vůz</span>
                </li>
                {hours && (
                  <li className="flex items-center gap-2">
                    <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                    <span>{hours}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Option 2: Post */}
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-4 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-[hsl(210_40%_96%)] px-2.5 py-1 text-xs font-semibold text-[hsl(222_47%_11%)]">
                  ČESKÁ POŠTA
                </span>
                <span className="text-xs sm:text-sm font-bold text-[hsl(222_47%_11%)]">
                  {shippingPriceRims || '500 Kč'} ALU / {shippingPriceTires || '600 Kč'} pneu
                </span>
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-[hsl(222_47%_11%)]">
                Doručení poštou po celé ČR
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Zásilková přeprava Českou poštou přímo na vaši adresu (balík do ruky na dobírku).
              </p>
              <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-[hsl(222_20%_28%)]">
                <li className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Doručení standardně do 24–48 hodin</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Bezpečné balení (karton + stretch fólie)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                  <span>Cena dopravy sady: {shippingPriceRims || '500 Kč'} za ALU disky, {shippingPriceTires || '600 Kč'} za pneumatiky</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Shipping Price Overview Table / Grid */}
          <div className="mt-8 rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-bold text-[hsl(222_47%_11%)]">
              Přehledný ceník přepravy (Česká pošta na dobírku)
            </h3>
            <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
              V inzerátech vždy uvádíme přesné poštovné pro danou sadu. Nejčastější ceny dle typu položky:
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-xs">
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
                <span className="font-semibold text-slate-500 block">Sada ALU disků (4 ks)</span>
                <span className="text-lg sm:text-xl font-black text-slate-950 block mt-0.5">{shippingPriceRims || '500 Kč'}</span>
                <span className="text-[10px] text-slate-500">nejčastější cena za sadu</span>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
                <span className="font-semibold text-slate-500 block">Sada pneumatik (4 ks)</span>
                <span className="text-lg sm:text-xl font-black text-slate-950 block mt-0.5">{shippingPriceTires || '600 Kč'}</span>
                <span className="text-[10px] text-slate-500">nejčastější cena za sadu</span>
              </div>
              <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs">
                <span className="font-semibold text-slate-500 block">Pár pneumatik (2 ks)</span>
                <span className="text-lg sm:text-xl font-black text-slate-950 block mt-0.5">cca 400 Kč</span>
                <span className="text-[10px] text-slate-500">dle rozměru pneu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-14">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Možnosti platby
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[hsl(214_32%_91%)] font-bold text-[hsl(142_71%_45%)]">
                💵
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(222_47%_11%)]">
                Hotově při převzetí
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Nejčastější způsob při osobním odběru na provozovně. Bez jakýchkoliv poplatků.
              </p>
            </div>

            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[hsl(214_32%_91%)] font-bold text-[hsl(142_71%_45%)]">
                📱
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(222_47%_11%)]">
                Okamžitý QR převod
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Platba mobilem přes bankovní aplikaci naskenováním QR kódu na místě.
              </p>
            </div>

            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[hsl(214_32%_91%)] font-bold text-[hsl(142_71%_45%)]">
                📦
              </div>
              <h3 className="mt-3 text-base font-bold text-[hsl(222_47%_11%)]">
                Dobírka na poště
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Zaplatíte doručovateli České pošty nebo na pobočce při převzetí balíku hotově nebo kartou.
              </p>
            </div>
          </div>
        </div>

        {/* Packaging standards */}
        <div className="mt-14 rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-6 sm:p-8">
          <h3 className="text-lg font-bold text-[hsl(222_47%_11%)]">
            Jak kola a pneumatiky balíme na přepravu?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[hsl(215_16%_47%)]">
            Disky vždy chráníme kartonovými proklady na čelní i zadní straně, aby během přepravy nedošlo k poškrábání laku. Celý balík následně omotáváme pevnou neprůhlednou stretch fólií s bezpečnostní páskou.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 border-t border-[hsl(214_32%_91%)] pt-6">
            <Link
              href="/shop#nabidka"
              className="inline-flex rounded-xl bg-[hsl(142_71%_45%)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(142_71%_35%)]"
            >
              Přejít do nabídky
            </Link>
            {phone && (
              <a
                href={`tel:${phoneHref}`}
                className="inline-flex rounded-xl border border-[hsl(214_32%_91%)] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
              >
                Dotaz na dopravu: {phone}
              </a>
            )}
          </div>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
