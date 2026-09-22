'use client';

import { useState } from 'react';
import { useShop } from './ShopContext';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export default function ShopFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { phone, phoneHref } = useShop();

  const faqs: FaqItem[] = [
    {
      question: 'Jak poznám, že použitá pneumatika nemá skrytý defekt?',
      answer:
        'Každou pneumatiku před zařazením do nabídky důkladně vizuálně i mechanicky kontrolujeme. Prověřujeme neporušenost patek, bočnice bez boulí a rovnoměrnost sjetí vzorku. Navíc si každý kus můžete před koupí osobně na provozovně Plzeň Jih sami detailně prohlédnout.',
    },
    {
      question: 'Je uvedená cena za 1 kus, nebo za celou sadu?',
      answer: (
        <>
          <p>
            <strong>U pneumatik</strong> je cena v inzerátu uvedena <strong>vždy za 1 kus</strong> (prodáváme pouze jako ucelenou sadu 4 ks nebo pár 2 ks dle popisu inzerátu).
          </p>
          <p className="mt-1.5">
            <strong>U ALU disků</strong> je uvedená cena <strong>vždy za celou sadu 4 disků</strong>.
          </p>
          <p className="mt-1.5 text-slate-500 text-xs">
            Přesná specifikace i účtování jsou vždy výslovně zopakovány přímo v textovém popisu každé položky.
          </p>
        </>
      ),
    },
    {
      question: 'Můžete mi kola na místě rovnou přezout a vyvážit?',
      answer:
        'Ano! V naší provozovně (Plzeň Jih) máme plně vybavený pneuservis. Po předchozí telefonické domluvě vám pneu rádi přezujeme, nasadíme na disky a precizně vyvážíme.',
    },
    {
      question: 'Zasíláte pneu i poštou po celé ČR a kolik stojí doprava?',
      answer: (
        <>
          <p>
            Preferujeme osobní odběr v lokalitě Plzeň Jih, kde si stav můžete ověřit na vlastní oči. Po domluvě však pneumatiky i disky bez problémů pečlivě zabalíme do kartonu a stretch fólie a odešleme Českou poštou na dobírku jako balík do ruky kamkoliv po ČR.
          </p>
          <p className="mt-1.5 font-medium text-slate-800">
            Dopravné vychází nejčastěji na <strong>500 Kč za sadu ALU disků</strong> a <strong>600 Kč za sadu pneumatik</strong> (přesnou částku vždy uvádíme přímo v inzerátu).
          </p>
        </>
      ),
    },
    {
      question: 'Co když mi rozměr nebo rozteč disků nebude sedět?',
      answer: (
        <>
          Doporučujeme mít při výběru po ruce velký technický průkaz vozu. Pokud si nejste jistí roztečí, středovým kroužkem nebo zálisem (ET), zavolejte nám předem na{' '}
          <a
            href={`tel:${phoneHref}`}
            className="font-bold text-[hsl(142_71%_35%)] hover:underline inline-block"
          >
            {phone}
          </a>{' '}
          a my vám kompatibilitu podle modelu auta zdarma prověříme.
        </>
      ),
    },
    {
      question: 'Jaká je minimální hloubka dezénu pneumatik?',
      answer:
        'V ČR je zákonem stanovené minimum pro zimní pneumatiky 4 mm (u vozidel do 3,5 t) a pro letní pneumatiky 1,6 mm. V naší nabídce uvádíme u každého kusu přesnou naměřenou hloubku dezénu kalibrovaným hloubkoměrem.',
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section id="faq" className="scroll-mt-20 sm:scroll-mt-24 border-b border-[hsl(214_32%_91%)] bg-white py-10 sm:py-18">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(142_71%_35%)]">
            Poradna & Odpovědi
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-3xl">
            Často kladené otázky
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[hsl(215_16%_47%)]">
            Vše, co potřebujete vědět před nákupem pneumatik a disků.
          </p>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-[hsl(214_32%_91%)] bg-white transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left font-semibold text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_98%)] active:bg-[hsl(210_40%_96%)]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-lg pr-3 leading-snug">{faq.question}</span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[hsl(214_32%_91%)] text-xs sm:text-sm transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[hsl(222_47%_11%)] text-white border-transparent' : 'text-[hsl(215_16%_47%)]'
                    }`}
                  >
                    ↓
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-[hsl(214_32%_93%)] bg-[hsl(210_40%_99%)] px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm leading-relaxed text-[hsl(222_20%_32%)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 sm:mt-10 rounded-2xl bg-[hsl(210_40%_97%)] p-4 sm:p-6 text-center border border-[hsl(214_32%_91%)]">
          <p className="text-xs sm:text-sm font-semibold text-[hsl(222_47%_11%)]">
            Máte dotaz, který zde není zodpovězen?
          </p>
          <p className="mt-1 text-[11px] sm:text-xs text-[hsl(215_16%_47%)]">
            Zavolejte nám přímo do dílny, rádi vám vše vysvětlíme.
          </p>
          <a
            href={`tel:${phoneHref}`}
            className="mt-3 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[hsl(142_71%_45%)] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-2xs hover:bg-[hsl(142_71%_35%)] active:scale-98"
          >
            <span>Zavolat na {phone}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
