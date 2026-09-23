'use client';

import Link from 'next/link';
import ShopHeader from '@/components/shop/ShopHeader';
import ShopFooter from '@/components/shop/ShopFooter';
import { useShop } from '@/components/shop/ShopContext';

export default function ObchodniPodminkyPage() {
  const {
    shopName,
    ownerName,
    ico,
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
          <span className="font-medium text-[hsl(222_47%_11%)]">Obchodní podmínky</span>
        </nav>

        {/* Page Header */}
        <div className="border-b border-[hsl(214_32%_91%)] pb-6 sm:pb-8">
          <span className="inline-block rounded-md bg-[hsl(210_40%_96%)] px-2.5 py-1 text-xs font-semibold text-[hsl(222_47%_11%)]">
            Právní informace
          </span>
          <h1 className="mt-2.5 sm:mt-3 text-2xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-4xl">
            Všeobecné obchodní podmínky
          </h1>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[hsl(215_16%_47%)]">
            Platné a účinné pro nákup zboží a služeb prostřednictvím internetového katalogu {shopName}.
          </p>
        </div>

        {/* Seller Info Card */}
        <div className="mt-6 sm:mt-8 rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.6)] p-4 sm:p-6 text-xs sm:text-sm">
          <h3 className="font-bold text-[hsl(222_47%_11%)] text-base">
            Identifikace provozovatele a prodávajícího:
          </h3>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-[hsl(222_20%_28%)]">
            <div>
              <dt className="text-xs text-[hsl(215_16%_47%)]">Jméno provozovatele</dt>
              <dd className="font-semibold">{ownerName || shopName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[hsl(215_16%_47%)]">IČO</dt>
              <dd className="font-semibold">{ico || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[hsl(215_16%_47%)]">Místo podnikání / Provozovna</dt>
              <dd>{addressLine}{addressCity ? `, ${addressCity}` : ''}</dd>
            </div>
            <div>
              <dt className="text-xs text-[hsl(215_16%_47%)]">Kontaktní telefon a e-mail</dt>
              <dd>
                {phone && (
                  <a
                    href={`tel:${phoneHref}`}
                    className="font-semibold text-[hsl(142_71%_35%)] hover:underline"
                  >
                    {phone.startsWith('+') ? phone : `+420 ${phone}`}
                  </a>
                )}
                {phone && email && ' · '}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="hover:underline"
                  >
                    {email}
                  </a>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Terms Sections */}
        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[hsl(222_20%_28%)]">
          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              1. Úvodní ustanovení
            </h2>
            <p className="mt-2">
              Tyto všeobecné obchodní podmínky (dále jen „VOP“) upravují vzájemná práva a povinnosti smluvních stran vzniklé v souvislosti nebo na základě kupní smlouvy uzavírané mezi prodávajícím a jinou fyzickou či právnickou osobou (dále jen „kupující“) prostřednictvím internetového katalogu a osobního odběru v provozovně prodávajícího.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              2. Objednání zboží a uzavření kupní smlouvy
            </h2>
            <p className="mt-2">
              Veškerá prezentace zboží umístěná ve webovém katalogu je informativního charakteru a prodávající není povinen uzavřít kupní smlouvu ohledně tohoto zboží. Ustanovení § 1732 odst. 2 občanského zákoníku se nepoužije.
            </p>
            <p className="mt-2">
              Objednávku provádí kupující telefonicky nebo prostřednictvím poptávkového formuláře. Kupní smlouva vzniká potvrzením rezervace zboží prodávajícím, případně osobním převzetím a zaplacením zboží v provozovně prodávajícího.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              3. Ceny zboží a platební podmínky
            </h2>
            <p className="mt-2">
              Ceny prezentované v katalogu jsou konečné v českých korunách (CZK). Náklady na případnou přepravu zásilkovou službou jsou kalkulovány samostatně a sděleny kupujícímu před odesláním zásilky.
            </p>
            <p className="mt-2">
              Kupní cenu může kupující uhradit prodávajícímu:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>hotově při osobním převzetí v provozovně prodávajícího;</li>
              <li>okamžitým bezhotovostním převodem / QR platbou na bankovní účet prodávajícího;</li>
              <li>na dobírku při doručení zboží přepravní službou.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              4. Dodání zboží a přeprava
            </h2>
            <p className="mt-2">
              Standardním a preferovaným způsobem dodání je <strong>osobní odběr na provozovně{addressLine ? ` (${addressLine})` : ''}</strong>, kde má kupující možnost si zboží před zaplacením fyzicky prohlédnout a zkontrolovat.
            </p>
            <p className="mt-2">
              Při zaslání zboží poštou je kupující povinen při převzetí od přepravce zkontrolovat neporušenost obalu a v případě zjevných vad toto neprodleně oznámit dopravci a sepsat škodní zápis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              5. Specifika použitého zboží a záruka
            </h2>
            <p className="mt-2">
              Prodávající nabízí nové i použité pneumatiky a disky. U použitého zboží odpovídá prodávající za vady, které mělo zboží při převzetí kupujícím, vyjma vad odpovídajících míře běžného opotřebení, které mělo zboží při převzetí (§ 2167 písm. c) občanského zákoníku).
            </p>
            <p className="mt-2">
              U použitého zboží prodávající předem transparentně uvádí skutečný stav, reálné fotografie a naměřenou hloubku dezénu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              6. Odstoupení od smlouvy spotřebitelem
            </h2>
            <p className="mt-2">
              V případě, že je kupní smlouva uzavřena distančním způsobem (při doručení zásilkovou službou), má kupující spotřebitel právo v souladu s § 1829 občanského zákoníku odstoupit od smlouvy do 14 dnů od převzetí zboží. Pro odstoupení je nutné prodávajícího kontaktovat a zboží vrátit nepoškozené a bez stop po montáži a užívání v provozu na adresu provozovny.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              7. Ochrana osobních údajů (GDPR)
            </h2>
            <p className="mt-2">
              Osobní údaje kupujícího (jméno, telefonní číslo, e-mail, adresa pro doručení) jsou zpracovávány výhradně za účelem vyřízení objednávky, splnění kupní smlouvy a zákonných účetních povinností v souladu s Nařízením (EU) 2016/679 (GDPR). Osobní údaje nejsou předávány žádným třetím stranám kromě smluvního přepravce pro doručení zásilky.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[hsl(222_47%_11%)]">
              8. Mimosoudní řešení sporů
            </h2>
            <p className="mt-2">
              K mimosoudnímu řešení spotřebitelských sporů z kupní smlouvy je příslušná Česká obchodní inspekce (ČOI), se sídlem Štěpánská 567/15, 120 00 Praha 2, IČ: 000 20 869, internetová adresa:{' '}
              <a
                href="https://www.coi.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(142_71%_35%)] hover:underline"
              >
                www.coi.cz
              </a>.
            </p>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 border-t border-[hsl(214_32%_91%)] pt-6 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="rounded-xl bg-[hsl(142_71%_45%)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[hsl(142_71%_35%)]"
          >
            Přejít do nabídky
          </Link>
          <Link
            href="/shop/doprava-a-platba"
            className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
          >
            Doprava a platba
          </Link>
          <Link
            href="/shop/kontakt"
            className="rounded-xl border border-[hsl(214_32%_91%)] bg-white px-5 py-2.5 text-sm font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]"
          >
            Kontakt
          </Link>
        </div>
      </main>

      <ShopFooter />
    </div>
  );
}
