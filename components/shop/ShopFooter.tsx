'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SHOP_FOOTER_LINKS } from './shopConfig';
import { useShop } from './ShopContext';
import { scrollToShopSection } from './shopScroll';

export default function ShopFooter() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const {
    shopName,
    phone,
    phoneHref,
    email,
    addressLine,
    addressCity,
    hours,
    ownerName,
    ico,
    caravanUrl,
    googleMapsLink,
  } = useShop();

  const handleFooterLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/shop#') && pathname === '/shop') {
      e.preventDefault();
      const sectionId = href.replace('/shop#', '');
      scrollToShopSection(sectionId);
    }
  };

  return (
    <footer className="border-t border-[hsl(214_32%_91%)] bg-[hsl(222_47%_11%)] text-white">
      {/* Top benefits strip */}
      <div className="border-b border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-3 py-4 sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(142_71%_45%/0.2)] text-[hsl(142_71%_45%)] font-bold text-xs sm:text-sm">
              ✓
            </span>
            <div className="text-[11px] sm:text-xs">
              <p className="font-semibold text-white">Osobní prohlídka</p>
              <p className="text-white/60">{addressLine || 'Osobní odběr'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(142_71%_45%/0.2)] text-[hsl(142_71%_45%)] font-bold text-xs sm:text-sm">
              ✓
            </span>
            <div className="text-[11px] sm:text-xs">
              <p className="font-semibold text-white">Přesný vzorek v mm</p>
              <p className="text-white/60">Změřeno kalibrem</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(142_71%_45%/0.2)] text-[hsl(142_71%_45%)] font-bold text-xs sm:text-sm">
              ✓
            </span>
            <div className="text-[11px] sm:text-xs">
              <p className="font-semibold text-white">Žádné skryté vady</p>
              <p className="text-white/60">100% reálné fotografie</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(142_71%_45%/0.2)] text-[hsl(142_71%_45%)] font-bold text-xs sm:text-sm">
              ✓
            </span>
            <div className="text-[11px] sm:text-xs">
              <p className="font-semibold text-white">Přezutí na místě</p>
              <p className="text-white/60">Kompletní servis</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* Col 1: Brand */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(142_71%_45%)] text-white font-bold">
              {shopName.charAt(0)}
            </div>
            <span className="text-lg font-bold tracking-tight text-white">{shopName}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Rodinný prodej prověřených pneumatik a disků{addressLine ? ` v lokalitě ${addressLine}` : ''}. Osobní přístup, férové jednání a možnost vyzkoušení i přezutí.
          </p>
          {caravanUrl && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-white/50">Provozujeme také:</p>
              <a
                href={caravanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[hsl(142_71%_45%)] hover:underline"
              >
                <span>{caravanUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')}</span>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Col 2: Nabídka & Služby */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Katalog & Služby</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {SHOP_FOOTER_LINKS.shop.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={(e) => handleFooterLinkClick(e, link.href)}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {SHOP_FOOTER_LINKS.services.slice(0, 2).map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={(e) => handleFooterLinkClick(e, link.href)}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Informace & Nákup */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Informace o nákupu</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {SHOP_FOOTER_LINKS.info.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Kontakt & Adresa */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Kontakt & Odběr</h4>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            {ownerName && <p className="font-medium text-white">{ownerName}</p>}
            {phone && (
              <p>
                <a
                  href={`tel:${phoneHref}`}
                  className="font-semibold text-[hsl(142_71%_45%)] hover:underline"
                >
                  {phone.startsWith('+') ? phone : `+420 ${phone}`}
                </a>
              </p>
            )}
            {email && (
              <p>
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </p>
            )}
            <p className="pt-2 text-white/90">
              {addressLine}{addressCity ? `, ${addressCity}` : ''}
            </p>
            {hours && <p className="text-xs text-white/50">{hours}</p>}
            {ico && <p className="text-xs text-white/50">IČO: {ico}</p>}
            {googleMapsLink && (
              <div className="pt-2">
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[hsl(142_71%_45%)] hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Otevřít v mapách</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-white/10 bg-black/20 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-white/50 sm:flex-row sm:px-6">
          <p>© {currentYear} {shopName}. Všechna práva vyhrazena.</p>
          <div className="flex items-center gap-4">
            <Link href="/shop/obchodni-podminky" className="hover:text-white/80">
              Obchodní podmínky
            </Link>
            <span>·</span>
            <Link href="/shop/doprava-a-platba" className="hover:text-white/80">
              Doprava
            </Link>
            <span>·</span>
            <Link href="/shop/kontakt" className="hover:text-white/80">
              Kontakt
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
