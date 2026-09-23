'use client';

import Link from 'next/link';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopFooter from '@/components/shop/ShopFooter';
import { useShop } from '@/components/shop/ShopContext';

export default function JakNakoupitPage() {
  const { phone, phoneHref, addressLine } = useShop();

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
          <span className="font-medium text-[hsl(222_47%_11%)]">Jak vybrat a nakoupit</span>
        </nav>

        {/* Page Header */}
        <div className="border-b border-[hsl(214_32%_91%)] pb-8">
          <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
            Průvodce nákupem
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-4xl">
            Jak vybrat správné pneu a jak u nás nakoupit
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[hsl(215_16%_47%)]">
            Přehledný návod, jak číst značení pneumatik a disků podle technického průkazu, abyste vybrali přesně to, co na vaše auto sedí.
          </p>
        </div>

        {/* 3 Step Ordering */}
        <div className="mt-10">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Postup nákupu v 3 krocích
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">01</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Najděte rozměr v TP
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Podívejte se do velkého technického průkazu vozu (nebo na sloupek dveří) na povolené rozměry.
              </p>
            </div>
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">02</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Vyberte sadu a zavolejte
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Zvolte sadu v katalogu{phone ? <> a zavolejte nám na{' '}
                <a
                  href={`tel:${phoneHref}`}
                  className="font-bold text-[hsl(142_71%_35%)] hover:underline inline-block"
                >
                  {phone}
                </a>{' '}</> : ' '}
                pro okamžitou rezervaci.
              </p>
            </div>
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">03</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Zkontrolujte a převezměte
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Zboží si osobně prohlédnete {addressLine ? `u nás (${addressLine})` : 'na provozovně'}, změříte a po domluvě vám ho na místě přezujeme.
              </p>
            </div>
          </div>
        </div>

        {/* Tire Anatomy Breakdown */}
        <div className="mt-14">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Jak číst značení pneumatik (příklad: 205/55 R16 91V)
          </h2>

          <div className="mt-6 rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-4 sm:p-8">
            <div className="mb-5 sm:mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 rounded-xl bg-[hsl(222_47%_11%)] p-3 sm:p-4 text-center font-mono text-lg sm:text-2xl font-bold text-white">
              <span className="text-[hsl(142_71%_45%)]">205</span>
              <span className="text-white/40">/</span>
              <span className="text-amber-400">55</span>
              <span className="text-sky-400">R16</span>
              <span className="text-purple-300">91</span>
              <span className="text-emerald-300">V</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border border-[hsl(214_32%_91%)] p-4">
                <span className="font-bold text-[hsl(142_71%_35%)]">205 — Šířka pláště</span>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Nominální šířka pneumatiky v milimetrech od bočnice k bočnici.
                </p>
              </div>

              <div className="rounded-xl border border-[hsl(214_32%_91%)] p-4">
                <span className="font-bold text-amber-600">55 — Profilové číslo</span>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Výška bočnice vyjádřená jako procentuální poměr k šířce (55 % z 205 mm = cca 113 mm).
                </p>
              </div>

              <div className="rounded-xl border border-[hsl(214_32%_91%)] p-4">
                <span className="font-bold text-sky-600">R16 — Průměr ráfku</span>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Písmeno R značí radiální konstrukci pláště, číslo 16 je vnitřní průměr v palcích.
                </p>
              </div>

              <div className="rounded-xl border border-[hsl(214_32%_91%)] p-4">
                <span className="font-bold text-purple-700">91 — Index nosnosti</span>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Maximální povolené zatížení na jednu pneumatiku (91 = 615 kg).
                </p>
              </div>

              <div className="rounded-xl border border-[hsl(214_32%_91%)] p-4 sm:col-span-2">
                <span className="font-bold text-emerald-700">V — Rychlostní index</span>
                <p className="mt-1 text-xs text-[hsl(215_16%_47%)]">
                  Maximální konstrukční rychlost, pro kterou je plášť homologován (T = 190 km/h, H = 210 km/h, V = 240 km/h, W = 270 km/h, Y = 300 km/h).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel / Rim Guide */}
        <div className="mt-14">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Jak rozumět rozměrům disků (např. 7J x 16 5x112 ET45)
          </h2>

          <div className="mt-6 rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.5)] p-6 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[hsl(214_32%_91%)] pb-3">
              <span className="font-semibold text-[hsl(222_47%_11%)]">7J x 16 (Šířka a průměr)</span>
              <span className="text-xs text-[hsl(215_16%_47%)]">7 palců šířka, J profil patky, 16 palců průměr disku</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[hsl(214_32%_91%)] pb-3">
              <span className="font-semibold text-[hsl(222_47%_11%)]">5x112 (Rozteč šroubů)</span>
              <span className="text-xs text-[hsl(215_16%_47%)]">5 upevňovacích otvorů na kružnici o průměru 112 mm (časté u VW, Škoda, Audi)</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[hsl(214_32%_91%)] pb-3">
              <span className="font-semibold text-[hsl(222_47%_11%)]">ET 45 (Zális ráfku)</span>
              <span className="text-xs text-[hsl(215_16%_47%)]">Vzdálenost dosedací plochy disku od středu disku v mm. Menší ET = kolo vyleze ven, větší ET = kolo zaleze dovnitř</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <span className="font-semibold text-[hsl(222_47%_11%)]">Středová díra (CB)</span>
              <span className="text-xs text-[hsl(215_16%_47%)]">Průměr středového otvoru na náboj kola (např. 57,1 mm nebo 66,6 mm), lze upravit vymezovacími kroužky</span>
            </div>
          </div>
        </div>

        {/* Tread Depth & DOT Code */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-6">
            <h3 className="text-base font-bold text-[hsl(222_47%_11%)]">
              Minimální hloubka dezénu
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
              Zákon v ČR ukládá:
            </p>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm text-[hsl(222_20%_28%)]">
              <li>• <strong>Zimní pneu:</strong> zákonné minimum 4 mm (od 1. 11. do 31. 3.)</li>
              <li>• <strong>Letní pneu:</strong> zákonné minimum 1,6 mm (doporučujeme 3 mm)</li>
            </ul>
            <p className="mt-3 text-xs text-[hsl(215_16%_55%)]">
              V naší nabídce uvádíme u všech plášťů skutečnou naměřenou hloubku dezénu v mm.
            </p>
          </div>

          <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-6">
            <h3 className="text-base font-bold text-[hsl(222_47%_11%)]">
              Co je DOT kód (věk pneu)?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
              Na bočnici každé pneumatiky je čtyřmístné číslo v oválu (např. DOT 2422):
            </p>
            <ul className="mt-3 space-y-1.5 text-xs sm:text-sm text-[hsl(222_20%_28%)]">
              <li>• První 2 číslice = týden výroby (24 = 24. týden)</li>
              <li>• Poslední 2 číslice = rok výroby (22 = rok 2022)</li>
            </ul>
            <p className="mt-3 text-xs text-[hsl(215_16%_55%)]">
              Pneumatiky pečlivě kontrolujeme také z hlediska zpuchření či ztvrdnutí směsi.
            </p>
          </div>
        </div>

        {/* CTA Box */}
        <div className="mt-14 rounded-2xl bg-[hsl(210_40%_97%)] p-6 sm:p-8 text-center border border-[hsl(214_32%_91%)]">
          <h3 className="text-lg font-bold text-[hsl(222_47%_11%)]">
            Nevíte si rady s výběrem rozměru?
          </h3>
          <p className="mt-2 text-sm text-[hsl(215_16%_47%)]">
            Zavolejte nám, řekněte značku a model svého auta a my vám rádi pomůžeme s kontrolou kompatibility.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {phone && (
              <a
                href={`tel:${phoneHref}`}
                className="rounded-xl bg-[hsl(142_71%_45%)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(142_71%_35%)]"
              >
                Zavolat {phone}
              </a>
            )}
            <Link
              href="/shop#nabidka"
              className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
            >
              Přejít do nabídky
            </Link>
          </div>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
