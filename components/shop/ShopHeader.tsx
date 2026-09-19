'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SHOP_NAME,
  SHOP_PHONE,
  SHOP_PHONE_HREF,
  SHOP_NAV_ITEMS,
} from './shopConfig';
import { scrollToShopSection } from './shopScroll';

export default function ShopHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/shop#') && pathname === '/shop') {
      e.preventDefault();
      const sectionId = href.replace('/shop#', '');
      if (mobileOpen) {
        setMobileOpen(false);
        setTimeout(() => {
          scrollToShopSection(sectionId);
        }, 50);
      } else {
        scrollToShopSection(sectionId);
      }
    }
  };

  return (
    <>
      {/* Top announcement bar */}
      <div className="border-b border-[hsl(214_32%_91%)] bg-[hsl(210_40%_97%)] text-xs sm:text-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-1.5 sm:px-6 sm:py-2">
          <div className="flex items-center gap-2 truncate text-[hsl(215_16%_47%)]">
            <span className="inline-block h-2 w-2 rounded-full bg-[hsl(142_71%_45%)] shrink-0" />
            <span className="font-medium text-[hsl(222_47%_11%)] truncate">Osobní odběr Plzeň Jih</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-[hsl(215_16%_47%)] shrink-0">
            <svg className="h-3.5 w-3.5 text-[hsl(142_71%_45%)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Možnost prohlídky i přezutí</span>
          </div>
        </div>
      </div>

      {/* Main sticky navigation */}
      <header className="sticky top-0 z-40 border-b border-[hsl(214_32%_91%/0.8)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3.5">
          <Link
            href="/shop"
            onClick={(e) => {
              if (pathname === '/shop') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                if (mobileOpen) setMobileOpen(false);
              }
            }}
            className="group flex items-center gap-2"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[hsl(222_47%_11%)] text-white font-bold transition-transform group-hover:scale-105">
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="8" strokeWidth={2} />
                <circle cx="12" cy="12" r="3.5" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={1.8} d="M12 4v2m0 12v2M4 12h2m12 0h2" />
              </svg>
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[hsl(222_47%_11%)] leading-tight block">
                Duplux <span className="font-semibold text-[hsl(142_71%_45%)]">Pneu</span>
              </span>
              <p className="hidden text-[10px] uppercase tracking-wider text-[hsl(215_16%_47%)] sm:block">
                Pneuservis & Bazar Plzeň
              </p>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-[hsl(222_47%_11%)] lg:flex">
            {SHOP_NAV_ITEMS.map((item) => {
              const isCurrent = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`transition-colors hover:text-[hsl(142_71%_35%)] ${
                    isCurrent ? 'font-semibold text-[hsl(142_71%_35%)]' : 'text-[hsl(222_20%_28%)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop direct call button */}
            <a
              href={`tel:${SHOP_PHONE_HREF}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-[hsl(142_71%_45%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[hsl(142_71%_35%)] hover:shadow active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{SHOP_PHONE}</span>
            </a>

            {/* Mobile quick call button */}
            <a
              href={`tel:${SHOP_PHONE_HREF}`}
              className="sm:hidden flex h-9 items-center gap-1.5 rounded-xl bg-[hsl(142_71%_45%)] px-2.5 text-white shadow-xs active:scale-95 text-xs font-bold"
              aria-label={`Zavolat ${SHOP_PHONE}`}
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{SHOP_PHONE}</span>
            </a>

            {/* Mobile menu toggle button */}
            <button
              type="button"
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[hsl(214_32%_91%)] text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)] active:scale-95"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Otevřít menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown with backdrop */}
        {mobileOpen && (
          <div className="border-t border-[hsl(214_32%_91%)] bg-white px-4 py-4 lg:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 text-sm font-medium">
              {SHOP_NAV_ITEMS.map((item) => {
                const isCurrent = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith('/shop#') && pathname === '/shop') {
                        handleNavClick(e, item.href);
                      } else {
                        setMobileOpen(false);
                      }
                    }}
                    className={`rounded-xl px-3 py-2.5 transition-colors ${
                      isCurrent
                        ? 'bg-[hsl(210_40%_96%)] font-semibold text-[hsl(142_71%_35%)]'
                        : 'text-[hsl(222_47%_11%)] hover:bg-[hsl(210_40%_96%)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-3 border-t border-[hsl(214_32%_91%)] pt-3">
                <a
                  href={`tel:${SHOP_PHONE_HREF}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[hsl(142_71%_45%)] py-3 text-center text-sm font-semibold text-white shadow-xs active:scale-98"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Zavolat {SHOP_PHONE}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
