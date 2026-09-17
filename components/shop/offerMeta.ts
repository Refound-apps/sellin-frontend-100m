import { ShopOffer } from '@/lib/types';

export type OfferMetaItem = {
  label: string;
};

export function formatCzk(price: number) {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(price);
}

export function getOfferExcerpt(offer: ShopOffer, max = 110) {
  const text = (offer.description || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

export function getOfferMeta(offer: ShopOffer): OfferMetaItem[] {
  const text = `${offer.title} ${offer.description || ''}`;
  const items: OfferMetaItem[] = [];

  if (/zimn/i.test(text)) items.push({ label: 'Zimní' });
  else if (/letn/i.test(text)) items.push({ label: 'Letní' });
  else if (/celoroč/i.test(text)) items.push({ label: 'Celoroční' });

  const size = text.match(/(\d{3})\s*\/\s*(\d{2})\s*(?:R|\/)?\s*(\d{2})/i);
  if (size) items.push({ label: `${size[1]}/${size[2]} R${size[3]}` });

  const count = text.match(/(\d+)\s*ks/i);
  if (count) items.push({ label: `${count[1]} ks` });

  const depth = text.match(/(\d+(?:\s*(?:a|–|-)\s*\d+)?)\s*mm/i);
  if (depth) items.push({ label: `${depth[1].replace(/\s+/g, ' ')} mm` });

  if (items.length < 4 && /\bdisky?\b/i.test(text)) items.push({ label: 'ALU disky' });
  if (items.length < 4 && /pneu|pneumatik/i.test(text)) items.push({ label: 'Pneu' });

  return items.slice(0, 4);
}

export function getOfferTags(offer: ShopOffer) {
  const text = `${offer.title} ${offer.description || ''}`;
  const tags: string[] = [];

  if (/zimn/i.test(text)) tags.push('Zimní');
  if (/letn/i.test(text)) tags.push('Letní');
  if (/celoroč/i.test(text)) tags.push('Celoroční');
  if (/\bdisky?\b|\balu\b/i.test(text)) tags.push('ALU disky');
  if (/pneu|pneumatik/i.test(text)) tags.push('Pneu');
  const brand = text.match(/\b(matador|kleber|hankook|semperit|michelin|continental|barum|nokian|goodyear|dunlop|pirelli|bridgestone|rial|ats|alutec|enkei|bbs|brock|dezent|dotz|ronal|borbet)\b/i);
  if (brand) {
    tags.push(brand[1][0].toUpperCase() + brand[1].slice(1).toLowerCase());
  }

  return [...new Set(tags)].slice(0, 4);
}

export interface StructuredSpec {
  label: string;
  value: string;
}

export interface OfferPricingInfo {
  isPerPiece: boolean;
  priceLabel: string;
  priceBadge: string;
  priceSuffix: string;
  summaryNote: string;
  shippingPrice: string;
  shippingText: string;
}

export function getOfferPricingInfo(offer: ShopOffer): OfferPricingInfo {
  const title = (offer.title || '').toLowerCase();
  const desc = (offer.description || '').toLowerCase();
  const text = `${title} ${desc}`;

  // 1. Explicit statement in description takes highest precedence
  const explicitPerPiece = /cena\s+(?:je\s+)?(?:vždy\s+)?za\s+(?:jeden\s+)?kus/i.test(desc);
  const explicitPerSet = /cena\s+(?:je\s+)?(?:vždy\s+)?za\s+(?:celou\s+)?sadu/i.test(desc);

  let isPerPiece = false;
  if (explicitPerPiece) {
    isPerPiece = true;
  } else if (explicitPerSet) {
    isPerPiece = false;
  } else {
    // 2. Derive by product type (tires = per piece, alu wheels = per set)
    const isPneuTitle = /pneu|pneumatik/i.test(title) && !/alu|disky?|elektrony/i.test(title);
    const isAluTitle = /alu|disky?|elektrony/i.test(title);

    if (isPneuTitle) {
      isPerPiece = true;
    } else if (isAluTitle) {
      isPerPiece = false;
    } else if (/pneu|pneumatik/i.test(text) && !/disky?|alu/i.test(text)) {
      isPerPiece = true;
    } else {
      isPerPiece = false;
    }
  }

  // Parse exact shipping from description if available
  const shippingMatch = desc.match(/(?:dopravn[ée]|poštovn[ée]|poslání|zaslání|přeprav[ay])\s*(?:je|vyjde na|činí)?\s*(\d{3,4})\s*kč/i);
  let shippingPrice = isPerPiece ? '600 Kč' : '500 Kč';
  if (shippingMatch) {
    shippingPrice = `${shippingMatch[1]} Kč`;
  }

  const countMatch = text.match(/(\d+)\s*ks/i);
  const countDesc = countMatch ? `sadu ${countMatch[1]} ks` : 'celou sadu';

  if (isPerPiece) {
    return {
      isPerPiece: true,
      priceLabel: 'Cena za 1 kus',
      priceBadge: 'Za 1 kus',
      priceSuffix: '/ kus',
      summaryNote: `Uvedená cena je za 1 kus (prodej jako ${countDesc}).`,
      shippingPrice,
      shippingText: `Česká pošta: ${shippingPrice}`,
    };
  }

  return {
    isPerPiece: false,
    priceLabel: 'Cena za sadu',
    priceBadge: 'Za sadu',
    priceSuffix: '',
    summaryNote: 'Konečná cena je za celou sadu uvedenou v inzerátu.',
    shippingPrice,
    shippingText: `Česká pošta: ${shippingPrice}`,
  };
}

export function getOfferSpecsList(offer: ShopOffer): StructuredSpec[] {
  const text = `${offer.title} ${offer.description || ''}`;
  const specs: StructuredSpec[] = [];

  // 1. Rozměr pneu
  const size = text.match(/(\d{3})\s*\/\s*(\d{2})\s*(?:R|\/)?\s*(\d{2})/i);
  if (size) {
    specs.push({ label: 'Rozměr', value: `${size[1]}/${size[2]} R${size[3]}` });
  }

  // 2. Sezóna
  if (/zimn/i.test(text)) {
    specs.push({ label: 'Sezóna', value: 'Zimní' });
  } else if (/letn/i.test(text)) {
    specs.push({ label: 'Sezóna', value: 'Letní' });
  } else if (/celoroč/i.test(text)) {
    specs.push({ label: 'Sezóna', value: 'Celoroční' });
  }

  // 3. Rozteč šroubů
  const pcd = text.match(/(\d\s*x\s*\d{2,3}(?:\.\d)?)/i);
  if (pcd) {
    specs.push({ label: 'Rozteč', value: pcd[1].replace(/\s+/g, '') });
  }

  // 4. Zális (ET)
  const et = text.match(/\bET\s*(\d{1,2})\b/i);
  if (et) {
    specs.push({ label: 'Zális (ET)', value: `ET ${et[1]}` });
  }

  // 5. Šířka disku (např. 7,5J, 8J)
  const jWidth = text.match(/\b(\d+(?:[.,]\d+)?)\s*J\b/i);
  if (jWidth) {
    specs.push({ label: 'Šířka disku', value: `${jWidth[1].replace('.', ',')}J` });
  }

  // 6. Středová díra (např. 67,1 mm, 57,1 mm)
  const centerBore = text.match(/(?:středov[aáé]\s*dír[ay]|střed|CB)\s*[:=]?\s*(\d{2}(?:[.,]\d+)?)\s*mm/i);
  if (centerBore) {
    specs.push({ label: 'Střed. díra', value: `${centerBore[1].replace('.', ',')} mm` });
  }

  // 7. Hloubka dezénu (Vzorek - pouze reálné hodnoty pneu <= 12 mm, nebo s explicitním slovem vzorek/dezén)
  const explicitTread = text.match(/(?:vzorek|dezén|hloubka)\s*(?:cca|je|okolo)?\s*[:=]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:a|–|-|\/)\s*\d+(?:[.,]\d+)?)?)\s*mm/i);
  if (explicitTread) {
    specs.push({ label: 'Vzorek', value: `${explicitTread[1].replace(/\s+/g, ' ')} mm` });
  } else {
    const depthMatch = text.match(/\b([3-9]|1[0-2])(?:\s*(?:a|–|-|\/)\s*([3-9]|1[0-2]))?\s*mm\b/i);
    if (depthMatch) {
      specs.push({ label: 'Vzorek', value: depthMatch[0].trim() });
    }
  }

  // 8. Průměr ráfku (pokud nebyl v rozměru pneu)
  if (!size) {
    const rim = text.match(/(?:R|")\s*(\d{2})\b/i);
    if (rim) {
      specs.push({ label: 'Průměr', value: `R${rim[1]}` });
    }
  }

  // 9. Značka výrobce
  const brand = text.match(/\b(matador|kleber|hankook|semperit|michelin|continental|barum|nokian|goodyear|dunlop|pirelli|bridgestone|rial|ats|alutec|enkei|bbs|brock|dezent|dotz|ronal|borbet)\b/i);
  if (brand) {
    specs.push({ label: 'Značka', value: brand[1][0].toUpperCase() + brand[1].slice(1).toLowerCase() });
  }

  // 10. Typ položky
  const count = text.match(/(\d+)\s*ks/i);
  const titleLower = offer.title.toLowerCase();
  const isWheelTitle = /\bdisky?\b|\balu\b|elektrony/i.test(titleLower);
  const isTireTitle = /pneu|pneumatik/i.test(titleLower);
  const isKompletTitle = /komplet/i.test(titleLower) || (isWheelTitle && isTireTitle);

  if (isKompletTitle) {
    specs.push({ label: 'Typ', value: count ? `Kompletní kola (${count[1]} ks)` : 'Kompletní sada' });
  } else if (isWheelTitle) {
    specs.push({ label: 'Typ', value: count ? `ALU disky (${count[1]} ks)` : 'ALU disky' });
  } else if (isTireTitle) {
    specs.push({ label: 'Typ', value: count ? `Pneumatiky (${count[1]} ks)` : 'Pneumatiky' });
  } else {
    const isWheel = /\bdisky?\b|\balu\b|elektrony/i.test(text);
    const isTire = /pneu|pneumatik/i.test(text);
    if (isWheel && isTire) {
      specs.push({ label: 'Typ', value: count ? `Kompletní kola (${count[1]} ks)` : 'Kompletní sada' });
    } else if (isWheel) {
      specs.push({ label: 'Typ', value: count ? `ALU disky (${count[1]} ks)` : 'ALU disky' });
    } else if (isTire) {
      specs.push({ label: 'Typ', value: count ? `Pneumatiky (${count[1]} ks)` : 'Pneumatiky' });
    }
  }

  // 11. Účtování ceny (za kus u pneu, za sadu u alu)
  const pricing = getOfferPricingInfo(offer);
  specs.push({
    label: 'Cena',
    value: pricing.isPerPiece ? 'uvedena za 1 ks' : 'za celou sadu',
  });

  return specs;
}

export const TIRE_WIDTHS = ['175', '185', '195', '205', '215', '225', '235', '245', '255', '265'];
export const TIRE_PROFILES = ['35', '40', '45', '50', '55', '60', '65', '70', '75'];
export const TIRE_RIMS = ['14', '15', '16', '17', '18', '19', '20', '21'];
