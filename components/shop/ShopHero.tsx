'use client';

import { useShop } from './ShopContext';
import { scrollToShopSection } from './shopScroll';

interface ShopHeroProps {
  onQuickFilter?: (filterType: 'type' | 'season' | 'rim', value: string) => void;
  activeRim?: string;
  activeSeason?: string;
  activeType?: string;
}

export default function ShopHero({
  onQuickFilter,
  activeRim,
  activeSeason,
  activeType,
}: ShopHeroProps) {
  const { phone, phoneHref, addressLine, region } = useShop();
  const quickRims = ['15', '16', '17', '18', '19'];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(210_40%_98%)] via-[hsl(210_30%_96%)] to-white pt-8 pb-12 sm:pt-16 sm:pb-20">
      {/* Background Decorative Layer - Minimalist automotive blueprint grid & tread contours */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden" aria-hidden="true">
        {/* Subtle radial ambient glows */}
        <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-[hsl(142_71%_45%/0.08)] blur-3xl" />
        <div className="absolute top-1/2 left-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[hsl(215_25%_88%/0.5)] blur-2xl" />

        {/* Minimalist dot grid pattern with radial gradient mask */}
        <svg
          className="absolute inset-0 h-full w-full stroke-neutral-900/[0.04] [mask-image:radial-gradient(ellipse_70%_60%_at_60%_35%,#000_10%,transparent_80%)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="hero-grid-pattern"
              width="36"
              height="36"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 36 0 L 0 0 0 36" fill="none" strokeWidth="0.8" />
              <circle cx="36" cy="36" r="1" fill="currentColor" fillOpacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-grid-pattern)" />
        </svg>

        {/* Minimalist tyre contour & rim geometric watermark (right-aligned, smooth ambient rotation) */}
        <div className="absolute -right-20 md:-right-16 top-1/2 hidden md:block -translate-y-1/2 pointer-events-none">
          <svg
            width="440"
            height="440"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="origin-center select-none"
          >
            <defs>
              {/* Subtle emerald ambient aura in the inner wheel */}
              <radialGradient id="wheel-hub-aura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity="0.12" />
                <stop offset="55%" stopColor="hsl(142 71% 45%)" stopOpacity="0.03" />
                <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity="0" />
              </radialGradient>
              {/* Subtle metallic rim gradient */}
              <linearGradient id="rim-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity="0.38" />
                <stop offset="50%" stopColor="hsl(222 47% 11%)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity="0.32" />
              </linearGradient>
            </defs>

            {/* Inner ambient glow behind spokes */}
            <circle cx="200" cy="200" r="110" fill="url(#wheel-hub-aura)" />

            {/* Base tyre & rim geometry (austere technical blueprint lines) */}
            <g stroke="hsl(222 47% 11% / 0.065)">
              <circle cx="200" cy="200" r="180" strokeWidth="3" strokeDasharray="6 6" />
              <circle cx="200" cy="200" r="150" strokeWidth="2" />
              <circle cx="200" cy="200" r="110" strokeWidth="4" />
              <circle cx="200" cy="200" r="50" strokeWidth="2.5" />

              {/* Minimalist rim spokes */}
              <line x1="200" y1="50" x2="200" y2="90" strokeWidth="5" strokeLinecap="round" />
              <line x1="200" y1="310" x2="200" y2="350" strokeWidth="5" strokeLinecap="round" />
              <line x1="50" y1="200" x2="90" y2="200" strokeWidth="5" strokeLinecap="round" />
              <line x1="310" y1="200" x2="350" y2="200" strokeWidth="5" strokeLinecap="round" />
              <line x1="94" y1="94" x2="122" y2="122" strokeWidth="5" strokeLinecap="round" />
              <line x1="278" y1="278" x2="306" y2="306" strokeWidth="5" strokeLinecap="round" />
              <line x1="306" y1="94" x2="278" y2="122" strokeWidth="5" strokeLinecap="round" />
              <line x1="122" y1="278" x2="94" y2="306" strokeWidth="5" strokeLinecap="round" />

              {/* Tyre tread decorative accents around circumference */}
              <g id="tread-notches">
                {/* Quadrant 1 (Top) */}
                <path d="M 60 40 L 70 55 M 85 30 L 95 45 M 110 23 L 120 38 M 138 18 L 148 33" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 262 18 L 252 33 M 290 23 L 280 38 M 315 30 L 305 45 M 340 40 L 330 55" strokeWidth="2.5" strokeLinecap="round" />
                {/* Quadrant 2 (Right) */}
                <g transform="rotate(90 200 200)">
                  <path d="M 60 40 L 70 55 M 85 30 L 95 45 M 110 23 L 120 38 M 138 18 L 148 33" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 262 18 L 252 33 M 290 23 L 280 38 M 315 30 L 305 45 M 340 40 L 330 55" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                {/* Quadrant 3 (Bottom) */}
                <g transform="rotate(180 200 200)">
                  <path d="M 60 40 L 70 55 M 85 30 L 95 45 M 110 23 L 120 38 M 138 18 L 148 33" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 262 18 L 252 33 M 290 23 L 280 38 M 315 30 L 305 45 M 340 40 L 330 55" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                {/* Quadrant 4 (Left) */}
                <g transform="rotate(270 200 200)">
                  <path d="M 60 40 L 70 55 M 85 30 L 95 45 M 110 23 L 120 38 M 138 18 L 148 33" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 262 18 L 252 33 M 290 23 L 280 38 M 315 30 L 305 45 M 340 40 L 330 55" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              </g>
            </g>

            {/* Artistic highlights: Light, restrained touches of color */}
            {/* Fine emerald rim-edge accent pinstripe */}
            <circle
              cx="200"
              cy="200"
              r="147"
              stroke="url(#rim-accent-grad)"
              strokeWidth="1.5"
              strokeDasharray="16 12"
            />

            {/* Brake rotor drilled cooling points (sport disc aesthetic) */}
            <g fill="hsl(142 71% 35% / 0.16)">
              <circle cx="200" cy="122" r="1.5" />
              <circle cx="200" cy="132" r="1.5" />
              <circle cx="200" cy="268" r="1.5" />
              <circle cx="200" cy="278" r="1.5" />
              <circle cx="122" cy="200" r="1.5" />
              <circle cx="132" cy="200" r="1.5" />
              <circle cx="268" cy="200" r="1.5" />
              <circle cx="278" cy="200" r="1.5" />
              <circle cx="145" cy="145" r="1.5" />
              <circle cx="255" cy="145" r="1.5" />
              <circle cx="145" cy="255" r="1.5" />
              <circle cx="255" cy="255" r="1.5" />
            </g>

            {/* 5 Wheel lug bolt recesses around hub */}
            <g fill="hsl(222 47% 11% / 0.2)">
              <circle cx="200" cy="164" r="3" />
              <circle cx="234.2" cy="188.9" r="3" />
              <circle cx="221.2" cy="229.1" r="3" />
              <circle cx="178.8" cy="229.1" r="3" />
              <circle cx="165.8" cy="188.9" r="3" />
            </g>

            {/* Center hub cap with emerald badge accent */}
            <circle
              cx="200"
              cy="200"
              r="22"
              fill="hsl(142 71% 45% / 0.08)"
              stroke="hsl(142 71% 45% / 0.42)"
              strokeWidth="2"
            />
            <circle
              cx="200"
              cy="200"
              r="6.5"
              fill="hsl(142 71% 45% / 0.5)"
            />
          </svg>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top badge */}
        <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-[hsl(214_32%_88%)] bg-white px-3 py-1 text-xs font-semibold text-[hsl(222_47%_11%)] shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(142_71%_45%)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(142_71%_45%)]" />
          </span>
          <span className="truncate">Osobní odběr {addressLine || 'na provozovně'}</span>
          <span className="text-[hsl(214_32%_75%)]">·</span>
          <span className="hidden xs:inline font-medium text-[hsl(215_16%_47%)]">Aktuální nabídka na skladě</span>
          <span className="xs:hidden font-medium text-[hsl(215_16%_47%)]">Skladem</span>
        </div>

        {/* Main headline - Responsive font sizes */}
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-[hsl(222_47%_11%)] sm:text-5xl lg:text-[54px] lg:leading-[1.12]">
          Prověřené pneu a disky{' '}
          <span className="relative inline-block text-[hsl(142_71%_35%)]">
            bez rizika
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 sm:mt-5 max-w-2xl text-sm sm:text-lg leading-relaxed text-[hsl(215_16%_47%)]">
          Rodinný prodej zánovních i prověřených použitých pneumatik a disků{region || addressLine ? ` v lokalitě ${region || addressLine}` : ''}. Každou sadu pečlivě měříme, kontrolujeme a nabízíme osobní prohlídku.
        </p>

        {/* Action buttons - Stacked & Full Width on Mobile, Inline on Tablet+ */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <a
            href="#nabidka"
            onClick={(e) => {
              e.preventDefault();
              scrollToShopSection('nabidka');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(142_71%_45%)] px-6 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs transition-all hover:bg-[hsl(142_71%_35%)] active:scale-98 text-center"
          >
            <span>Prohlédnout nabídku</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          {phone && (
            <a
              href={`tel:${phoneHref}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[hsl(214_32%_88%)] bg-white px-6 py-3.5 text-sm sm:text-base font-semibold text-[hsl(222_47%_11%)] shadow-xs transition-all hover:bg-[hsl(210_40%_96%)] active:scale-98 text-center"
            >
              <svg className="h-4 w-4 text-[hsl(142_71%_45%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Zavolat {phone}</span>
            </a>
          )}
        </div>

        {/* Quick dimension selector chips - Horizontally swipeable on mobile */}
        {onQuickFilter && (
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[hsl(214_32%_91%)]">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[hsl(215_16%_47%)] mb-2">
              Rychlý výběr podle ráfku a typu:
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x sm:flex-wrap">
              <span className="text-xs font-medium text-[hsl(222_47%_11%)] mr-0.5 shrink-0">Ráfek:</span>
              {quickRims.map((rim) => {
                const isActive = activeRim === rim;
                return (
                  <button
                    key={rim}
                    type="button"
                    onClick={() => {
                      onQuickFilter('rim', isActive ? '' : rim);
                      scrollToShopSection('nabidka');
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-[hsl(222_47%_11%)] text-white shadow-xs'
                        : 'bg-white text-[hsl(222_47%_11%)] border border-[hsl(214_32%_88%)] hover:border-[hsl(142_71%_45%)]'
                    }`}
                  >
                    R{rim}
                  </button>
                );
              })}

              <span className="text-xs font-medium text-[hsl(222_47%_11%)] ml-2 mr-0.5 shrink-0">Kategorie:</span>
              <button
                type="button"
                onClick={() => {
                  onQuickFilter('season', activeSeason === 'zimni' ? '' : 'zimni');
                  scrollToShopSection('nabidka');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 active:scale-95 ${
                  activeSeason === 'zimni'
                    ? 'bg-[hsl(222_47%_11%)] text-white'
                    : 'bg-white text-[hsl(222_47%_11%)] border border-[hsl(214_32%_88%)] hover:border-[hsl(142_71%_45%)]'
                }`}
              >
                ❄ Zimní
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickFilter('season', activeSeason === 'letni' ? '' : 'letni');
                  scrollToShopSection('nabidka');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 active:scale-95 ${
                  activeSeason === 'letni'
                    ? 'bg-[hsl(222_47%_11%)] text-white'
                    : 'bg-white text-[hsl(222_47%_11%)] border border-[hsl(214_32%_88%)] hover:border-[hsl(142_71%_45%)]'
                }`}
              >
                ☀ Letní
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickFilter('type', activeType === 'disk' ? '' : 'disk');
                  scrollToShopSection('nabidka');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all shrink-0 active:scale-95 ${
                  activeType === 'disk'
                    ? 'bg-[hsl(222_47%_11%)] text-white'
                    : 'bg-white text-[hsl(222_47%_11%)] border border-[hsl(214_32%_88%)] hover:border-[hsl(142_71%_45%)]'
                }`}
              >
                ◎ ALU disky
              </button>
            </div>
          </div>
        )}

        {/* 4 Trust Metrics - 2x2 grid on mobile */}
        <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4 pt-5 sm:pt-6 border-t border-[hsl(214_32%_91%)]">
          <div className="rounded-xl bg-white p-2.5 sm:p-3.5 border border-[hsl(214_32%_91%)] shadow-2xs">
            <p className="text-lg sm:text-xl font-bold text-[hsl(222_47%_11%)]">100%</p>
            <p className="text-[11px] sm:text-xs text-[hsl(215_16%_47%)] mt-0.5">Reálné fotografie každé sady</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 sm:p-3.5 border border-[hsl(214_32%_91%)] shadow-2xs">
            <p className="text-lg sm:text-xl font-bold text-[hsl(222_47%_11%)]">Měřený vzorek</p>
            <p className="text-[11px] sm:text-xs text-[hsl(215_16%_47%)] mt-0.5">Přesná hloubka dezénu v mm</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 sm:p-3.5 border border-[hsl(214_32%_91%)] shadow-2xs">
            <p className="text-lg sm:text-xl font-bold text-[hsl(222_47%_11%)]">Dostupnost</p>
            <p className="text-[11px] sm:text-xs text-[hsl(215_16%_47%)] mt-0.5">{region || addressLine || 'Snadný příjezd autem'}</p>
          </div>
          <div className="rounded-xl bg-white p-2.5 sm:p-3.5 border border-[hsl(214_32%_91%)] shadow-2xs">
            <p className="text-lg sm:text-xl font-bold text-[hsl(222_47%_11%)]">Přezutí</p>
            <p className="text-[11px] sm:text-xs text-[hsl(215_16%_47%)] mt-0.5">Možnost montáže na místě</p>
          </div>
        </div>
      </div>
    </section>
  );
}
