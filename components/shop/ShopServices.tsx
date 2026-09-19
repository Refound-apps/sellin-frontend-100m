import { SHOP_PHONE, SHOP_PHONE_HREF } from './shopConfig';

export default function ShopServices() {
  const services = [
    {
      title: 'Přezutí na počkání',
      desc: 'Koupíte kola a rovnou s nimi můžete odjet. Pneumatiky přezujeme a nasadíme na váš vůz.',
      tag: 'Montáž',
    },
    {
      title: 'Vyvážení kol',
      desc: 'Vyvážení na přesné vyvažovačce pro klidnou jízdu bez vibrací ve volantu při jakékoliv rychlosti.',
      tag: 'Přesnost',
    },
    {
      title: 'Kontrola a měření',
      desc: 'Zkontrolujeme stav ventilků, rovinnost disků i případné skryté poškození či defekty běhounu.',
      tag: 'Bezpečnost',
    },
    {
      title: 'Odborné poradenství',
      desc: 'Nevíte, jaké ET, středovou díru nebo rozteč potřebuje vaše auto? Poradíme vám před nákupem.',
      tag: 'Zkušenosti',
    },
  ];

  return (
    <section id="sluzby" className="scroll-mt-20 sm:scroll-mt-24 border-b border-[hsl(214_32%_91%)] bg-white py-10 sm:py-18">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(142_71%_35%)]">
              Kompletní zázemí
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[hsl(222_47%_11%)] sm:text-3xl">
              Pneuservis & Služby Plzeň Jih
            </h2>
            <p className="mt-2 max-w-xl text-xs sm:text-base text-[hsl(215_16%_47%)]">
              Nejsme jen virtuální prodejce. Máme zázemí pneuservisu, kde vám vybrané pneumatiky rádi obujeme a zkontrolujeme.
            </p>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <a
              href={`tel:${SHOP_PHONE_HREF}`}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[hsl(222_47%_11%)] px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[hsl(222_47%_18%)] active:scale-98 text-center"
            >
              <svg className="h-4 w-4 text-[hsl(142_71%_45%)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Objednat termín montáže</span>
            </a>
          </div>
        </div>

        <div className="mt-6 sm:mt-10 grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[hsl(214_32%_91%)] bg-[hsl(210_40%_98%/0.5)] p-4 sm:p-5 transition-all hover:bg-white hover:border-[hsl(142_71%_45%/0.4)] hover:shadow-2xs"
            >
              <span className="inline-block rounded-md bg-white border border-[hsl(214_32%_91%)] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(142_71%_35%)]">
                {item.tag}
              </span>
              <h3 className="mt-2.5 sm:mt-3 text-sm sm:text-base font-bold text-[hsl(222_47%_11%)]">
                {item.title}
              </h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-[hsl(215_16%_47%)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
