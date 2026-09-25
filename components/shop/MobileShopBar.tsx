'use client';

import { useShop } from './ShopContext';
import { scrollToShopSection } from './shopScroll';

interface MobileShopBarProps {
  totalOffers?: number | null;
}

export default function MobileShopBar({ totalOffers }: MobileShopBarProps) {
  const { phone, phoneHref, addressLine, addressCity, googleMapsLink } = useShop();

  const handleCatalogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToShopSection('nabidka');
  };

  const handleInquiryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToShopSection('poptavka');
  };

  const mapTarget =
    googleMapsLink ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${addressLine || 'Úslavská 32'} ${addressCity || 'Plzeň'}`.trim()
    )}`;

  return (
    <aside
      aria-label="Rychlé mobilní akce"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-6px_25px_rgba(15,23,42,0.12)] pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 px-3 transition-transform duration-300"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
        {/* Call Now Button - Primary thumb action */}
        <a
          href={`tel:${phoneHref}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[hsl(142_71%_45%)] py-2.5 px-3 text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-[hsl(142_71%_35%)] active:scale-95 transition-all touch-manipulation min-h-[44px]"
          aria-label={`Zavolat na provozovnu ${phone}`}
        >
          <svg className="h-4 w-4 shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          <span className="truncate">Zavolat {phone}</span>
        </a>

        {/* Catalog jump */}
        <button
          type="button"
          onClick={handleCatalogClick}
          className="flex flex-col items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 py-1.5 px-3 min-h-[44px] transition-all touch-manipulation"
          aria-label="Přejít na nabídku kol"
        >
          <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" strokeWidth={2} />
            <circle cx="12" cy="12" r="3" strokeWidth={2} />
          </svg>
          <span className="text-[10px] font-bold mt-0.5">
            Nabídka{totalOffers ? ` (${totalOffers})` : ''}
          </span>
        </button>

        {/* Inquiry button */}
        <button
          type="button"
          onClick={handleInquiryClick}
          className="flex flex-col items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 py-1.5 px-3 min-h-[44px] transition-all touch-manipulation"
          aria-label="Poptat rozměr na míru"
        >
          <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="text-[10px] font-bold mt-0.5">Poptat</span>
        </button>

        {/* Location / Directions */}
        <a
          href={mapTarget}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 py-1.5 px-3 min-h-[44px] transition-all touch-manipulation"
          aria-label="Navigovat na provozovnu"
        >
          <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[10px] font-bold mt-0.5">Kde jsme</span>
        </a>
      </div>
    </aside>
  );
}
