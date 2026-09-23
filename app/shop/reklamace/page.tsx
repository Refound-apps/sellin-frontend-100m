'use client';

import Link from 'next/link';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopFooter from '@/components/shop/ShopFooter';
import { useShop } from '@/components/shop/ShopContext';

export default function ReklamacePage() {
  const {
    ownerName,
    shopName,
    addressLine,
    addressCity,
    phone,
    phoneHref,
    email,
  } = useShop();

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
          <span className="font-medium text-[hsl(222_47%_11%)]">Garance a reklamace</span>
        </nav>

        {/* Page Header */}
        <div className="border-b border-[hsl(214_32%_91%)] pb-6 sm:pb-8">
          <span className="inline-block rounded-md bg-[hsl(142_71%_45%/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(142_71%_35%)]">
            Záruka spokojenosti
          </span>
          <h1 className="mt-2.5 sm:mt-3 text-2xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-4xl">
            Garance stavu, reklamace a vrácení
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-[hsl(215_16%_47%)]">
            Dbáme na to, abyste od nás odjížděli s bezpečnými koly. Zde naleznete podrobné informace o garanci a postupu při případné reklamaci.
          </p>
        </div>

        {/* Quality Guarantee */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-lg font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Naše garance technického stavu
          </h2>
          <div className="mt-4 rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.5)] p-4 sm:p-6 space-y-3 text-xs sm:text-sm text-[hsl(222_20%_28%)] leading-relaxed">
            <p>
              Každá pneumatika a disk v naší nabídce prochází před prodejem <strong>důkladnou vizuální a mechanickou kontrolou</strong>:
            </p>
            <ul className="space-y-2 pt-1">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                <span><strong>Kontrola patky a těsnosti:</strong> Pneumatiky nemají poškozené patky ani vnitřní kordy.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                <span><strong>Bez boulí a defektů:</strong> Vylučujeme pláště se separací kordu, boulemi na bočnicích nebo nepřípustnými průrazy.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                <span><strong>Změřený dezén:</strong> Hloubku měříme kalibrovaným hloubkoměrem ve středových drážkách běhounu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(142_71%_45%)] font-bold">✓</span>
                <span><strong>Kontrola disků:</strong> U ALU disků prověřujeme rovinnost a stav dosedacích ploch.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 14 Day Return Period */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Odstoupení od smlouvy do 14 dnů (nákup na dálku)
          </h2>
          <div className="mt-4 rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-4 sm:p-6 text-xs sm:text-sm text-[hsl(222_20%_28%)] leading-relaxed space-y-2">
            <p>
              Při nákupu na dálku (s doručením přepravní službou) máte jako spotřebitel ze zákona právo odstoupit od kupní smlouvy do <strong>14 dnů od převzetí zboží</strong> bez udání důvodu.
            </p>
            <p>
              Zboží musí být vráceno v původním nepoškozeném stavu, bez známek montáže na vozidlo a bez poškození patek či ráfků.
            </p>
          </div>
        </div>

        {/* Complaints Procedure */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-2xl">
            Postup při uplatnění reklamace
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">1</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Kontaktujte nás
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                {phone ? <>Zavolejte na <strong>{phone}</strong></> : 'Kontaktujte nás'}
                {email ? <> nebo napište na <strong>{email}</strong></> : ''} a popište zjištěnou závadu.
              </p>
            </div>

            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">2</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Posouzení zboží
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                Zboží osobně prohlédneme v dílně{addressLine ? ` (${addressLine})` : ''}, případně ověříme na vyvažovačce nebo tlakové zkoušce.
              </p>
            </div>

            <div className="rounded-2xl border border-[hsl(214_32%_91%)] bg-white p-5">
              <span className="text-2xl font-black text-[hsl(142_71%_45%)]">3</span>
              <h3 className="mt-2 text-base font-bold text-[hsl(222_47%_11%)]">
                Vyřízení reklamace
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
                V případě oprávněné vady nabízíme výměnu za adekvátní sadu, slevu z kupní ceny nebo vrácení plné částky.
              </p>
            </div>
          </div>
        </div>

        {/* Contact address for claims */}
        <div className="mt-12 rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_97%)] p-6 sm:p-8">
          <h3 className="text-base font-bold text-[hsl(222_47%_11%)]">
            Adresa pro zaslání reklamovaného zboží a osobní vyřízení:
          </h3>
          <p className="mt-2 text-sm text-[hsl(222_20%_28%)]">
            <strong>{ownerName || shopName}</strong><br />
            {addressLine}<br />
            {addressCity && <>{addressCity}<br /></>}
            {phone && (
              <>
                Tel: <a href={`tel:${phoneHref}`} className="font-semibold text-[hsl(142_71%_35%)] hover:underline">{phone.startsWith('+') ? phone : `+420 ${phone}`}</a><br />
              </>
            )}
            {email && (
              <>
                E-mail: <a href={`mailto:${email}`} className="hover:underline">{email}</a>
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-xl bg-[hsl(142_71%_45%)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(142_71%_35%)]"
            >
              Zpět do nabídky
            </Link>
            <Link
              href="/shop/kontakt"
              className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
            >
              Kontaktní informace
            </Link>
          </div>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
