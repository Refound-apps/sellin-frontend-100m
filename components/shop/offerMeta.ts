import { ShopOffer } from '@/lib/types';

export type OfferMetaItem = {
  label: string;
};

/**
 * Rozpozná, zda nabídka představuje ALU disky.
 * Pravidlo klienta / projektu:
 * "alu disky jsou jen ty inzeráty, které začínají na Alu"
 */
export function isAluDiskyOffer(offer: { title?: string; description?: string }): boolean {
  const title = (offer.title || '').trim();
  return /^alu\b/i.test(title);
}

export function isSteelWheelOffer(offer: { title?: string; description?: string }): boolean {
  const title = (offer.title || '').trim();
  return /^(plech|ocel)/i.test(title) || /\b(plechové\s*disky|plecháče|ocelové\s*disky)\b/i.test(title);
}

/**
 * Rozpozná, zda nabídka představuje kola / disky (ALU disky, plechové disky, dodávkové disky apod.)
 * nebo čistě pneumatiky.
 */
export function isWheelOffer(offer: { title?: string; description?: string }): boolean {
  if (isAluDiskyOffer(offer)) return true;
  if (isSteelWheelOffer(offer)) return true;
  const title = (offer.title || '').trim();
  if (/^(dodávkové\s*disky|disky)\b/i.test(title)) return true;
  return false;
}

const BRAND_REGEX = /\b(matador|kleber|hankook|semperit|michelin|continental|barum|nokian|goodyear|dunlop|pirelli|bridgestone|falken|kumho|nexen|toyo|rial|ats|alutec|enkei|bbs|brock|dezent|dotz|ronal|borbet|platin|škoda|skoda|volkswagen|vw|audi|bmw|ford|seat|hyundai|kia|volvo|opel|renault|peugeot|mercedes|mazda|toyota|honda|nissan|mitsubishi|citroen|citroën|dacia|fiat|alfa|suzuki|subaru|jeep|land\s*rover|cupra|mini|porsche)\b/i;

function formatBrandName(raw: string): string {
  const b = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  if (b === 'vw' || b === 'volkswagen') return 'Volkswagen';
  if (b === 'skoda' || b === 'škoda') return 'Škoda';
  if (b === 'bmw') return 'BMW';
  if (b === 'citroen' || b === 'citroën') return 'Citroën';
  if (b === 'land rover') return 'Land Rover';
  if (b === 'mercedes') return 'Mercedes-Benz';
  return raw[0].toUpperCase() + raw.slice(1).toLowerCase();
}

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
  const isWheel = isWheelOffer(offer);

  if (isWheel) {
    const isAlu = isAluDiskyOffer(offer);
    const isSteel = isSteelWheelOffer(offer);
    items.push({ label: isAlu ? 'ALU disky' : (isSteel ? 'Plechové disky' : 'Disky') });

    // Rozteč šroubů
    const pcd = text.match(/(\d\s*x\s*\d{2,3}(?:\.\d)?)/i);
    if (pcd) items.push({ label: pcd[1].replace(/\s+/g, '') });

    // Průměr disku
    const rim = text.match(/(?:R|")\s*(\d{2})\b/i);
    if (rim) items.push({ label: `R${rim[1]}` });

    // Šířka disku (např. 7J) nebo počet kusů
    const jWidth = text.match(/\b(\d+(?:[.,]\d+)?)\s*J\b/i);
    if (jWidth) {
      items.push({ label: `${jWidth[1].replace('.', ',')}J` });
    } else {
      const count = text.match(/(\d+)\s*ks/i);
      if (count) items.push({ label: `${count[1]} ks` });
    }
  } else {
    // Pneumatiky: sezóna z titulku má přednost, rozměr, kusy, vzorek
    if (/\bzimn/i.test(offer.title)) items.push({ label: 'Zimní' });
    else if (/(?<!komp)\bletn/i.test(offer.title)) items.push({ label: 'Letní' });
    else if (/celoroč/i.test(offer.title)) items.push({ label: 'Celoroční' });
    else if (/\bzimn/i.test(text)) items.push({ label: 'Zimní' });
    else if (/(?<!komp)\bletn/i.test(text)) items.push({ label: 'Letní' });
    else if (/celoroč/i.test(text)) items.push({ label: 'Celoroční' });

    const size = text.match(/(\d{3})\s*\/\s*(\d{2})\s*(?:R|\/)?\s*(\d{2})/i);
    if (size) items.push({ label: `${size[1]}/${size[2]} R${size[3]}` });

    const count = text.match(/(\d+)\s*ks/i);
    if (count) items.push({ label: `${count[1]} ks` });

    const explicitTread = text.match(/(?:vzorek|dezén|hloubka)\s*(?:cca|je|okolo)?\s*[:=]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:a|–|-|\/)\s*\d+(?:[.,]\d+)?)?)\s*mm/i);
    if (explicitTread) {
      items.push({ label: `${explicitTread[1].replace(/\s+/g, ' ')} mm` });
    } else {
      const depthMatch = text.match(/(?<![0-9.,])\b([3-9]|1[0-2])(?:\s*(?:a|–|-|\/)\s*([3-9]|1[0-2]))?\s*mm\b/i);
      if (depthMatch) {
        items.push({ label: depthMatch[0].trim() });
      }
    }

    if (items.length < 4 && /pneu|pneumatik/i.test(text)) items.push({ label: 'Pneu' });
  }

  return items.slice(0, 4);
}

export function getOfferTags(offer: ShopOffer): string[] {
  const text = `${offer.title} ${offer.description || ''}`;
  const tags: string[] = [];
  const isWheel = isWheelOffer(offer);

  // ALU disky jsou zimní i letní, takže nemají mít tag letní pneu ani zimní pneu, pouze tag alu disky
  if (isWheel) {
    const isAlu = isAluDiskyOffer(offer);
    const isSteel = isSteelWheelOffer(offer);
    tags.push(isAlu ? 'ALU disky' : (isSteel ? 'Plechové disky' : 'Disky'));
  } else {
    if (/\bzimn/i.test(offer.title)) tags.push('Zimní');
    else if (/(?<!komp)\bletn/i.test(offer.title)) tags.push('Letní');
    else if (/celoroč/i.test(offer.title)) tags.push('Celoroční');
    else if (/\bzimn/i.test(text)) tags.push('Zimní');
    else if (/(?<!komp)\bletn/i.test(text)) tags.push('Letní');
    else if (/celoroč/i.test(text)) tags.push('Celoroční');
    tags.push('Pneu');
  }

  const brand = text.match(BRAND_REGEX);
  if (brand) {
    tags.push(formatBrandName(brand[1]));
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
  const isWheel = isWheelOffer(offer);
  const isSteel = isSteelWheelOffer(offer);

  // 1. Rozměr pneu (pouze pro pneumatiky)
  const size = text.match(/(\d{3})\s*\/\s*(\d{2})\s*(?:R|\/)?\s*(\d{2})/i);
  if (size && !isWheel) {
    specs.push({ label: 'Rozměr', value: `${size[1]}/${size[2]} R${size[3]}` });
  }

  // 2. Sezóna - "alu disky jsou zimní i letní, takže to nemá mít tag letní pneu, pouze tag alu disky"
  // ALU disky jsou celoroční / univerzální, parametr Sezóna patří POUZE k pneumatikám
  if (!isWheel) {
    if (/\bzimn/i.test(text)) {
      specs.push({ label: 'Sezóna', value: 'Zimní' });
    } else if (/(?<!komp)\bletn/i.test(text)) {
      specs.push({ label: 'Sezóna', value: 'Letní' });
    } else if (/celoroč/i.test(text)) {
      specs.push({ label: 'Sezóna', value: 'Celoroční' });
    }
  }

  // 3. Rozteč šroubů (např. 5x112, 5x108)
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

  // 7. Hloubka dezénu (Vzorek)
  // "u alu disky většinou žádný vzorek (mm) není, takže to tam nedávej do těch karet jako pill ani do parametru"
  // U disků se parametr Vzorek nepřidává!
  if (!isWheel) {
    const explicitTread = text.match(/(?:vzorek|dezén|hloubka)\s*(?:cca|je|okolo)?\s*[:=]?\s*(\d+(?:[.,]\d+)?(?:\s*(?:a|–|-|\/)\s*\d+(?:[.,]\d+)?)?)\s*mm/i);
    if (explicitTread) {
      specs.push({ label: 'Vzorek', value: `${explicitTread[1].replace(/\s+/g, ' ')} mm` });
    } else {
      const depthMatch = text.match(/(?<![0-9.,])\b([3-9]|1[0-2])(?:\s*(?:a|–|-|\/)\s*([3-9]|1[0-2]))?\s*mm\b/i);
      if (depthMatch) {
        specs.push({ label: 'Vzorek', value: depthMatch[0].trim() });
      }
    }
  }

  // 8. Průměr ráfku (pokud nebyl v rozměru pneu)
  const rim = text.match(/(?:R|")\s*(\d{2})\b/i) || (!isWheel && size ? [null, size[3]] : null);
  if (rim) {
    specs.push({ label: 'Průměr', value: `R${rim[1]}` });
  }

  // 9. Značka výrobce (zahrnuje i výrobce disků a značky vozidel)
  const brand = text.match(BRAND_REGEX);
  if (brand) {
    specs.push({ label: 'Značka', value: formatBrandName(brand[1]) });
  }

  // 10. Typ položky
  const count = text.match(/(\d+)\s*ks/i);
  if (isWheel) {
    const isAlu = isAluDiskyOffer(offer);
    const isSteel = isSteelWheelOffer(offer);
    const label = isAlu ? 'ALU disky' : (isSteel ? 'Plechové disky' : 'Disky');
    specs.push({ label: 'Typ', value: count ? `${label} (${count[1]} ks)` : label });
  } else {
    specs.push({ label: 'Typ', value: count ? `Pneumatiky (${count[1]} ks)` : 'Pneumatiky' });
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

export const TIRE_BRANDS = [
  { value: 'barum', label: 'Barum' },
  { value: 'bridgestone', label: 'Bridgestone' },
  { value: 'continental', label: 'Continental' },
  { value: 'dunlop', label: 'Dunlop' },
  { value: 'falken', label: 'Falken' },
  { value: 'goodyear', label: 'Goodyear' },
  { value: 'hankook', label: 'Hankook' },
  { value: 'kleber', label: 'Kleber' },
  { value: 'kumho', label: 'Kumho' },
  { value: 'matador', label: 'Matador' },
  { value: 'michelin', label: 'Michelin' },
  { value: 'nexen', label: 'Nexen' },
  { value: 'nokian', label: 'Nokian' },
  { value: 'pirelli', label: 'Pirelli' },
  { value: 'semperit', label: 'Semperit' },
  { value: 'toyo', label: 'Toyo' },
];

export const CAR_WHEEL_BRANDS = [
  { value: 'skoda', label: 'Škoda' },
  { value: 'volkswagen', label: 'Volkswagen (VW)' },
  { value: 'audi', label: 'Audi' },
  { value: 'bmw', label: 'BMW' },
  { value: 'mercedes', label: 'Mercedes-Benz' },
  { value: 'ford', label: 'Ford' },
  { value: 'seat', label: 'Seat' },
  { value: 'hyundai', label: 'Hyundai' },
  { value: 'kia', label: 'Kia' },
  { value: 'volvo', label: 'Volvo' },
  { value: 'opel', label: 'Opel' },
  { value: 'renault', label: 'Renault' },
  { value: 'peugeot', label: 'Peugeot' },
  { value: 'dezent', label: 'Disky Dezent' },
  { value: 'ronal', label: 'Disky Ronal' },
  { value: 'borbet', label: 'Disky Borbet' },
];

export const WHEEL_PCD_OPTIONS = [
  { value: '5x112', label: '5x112 (Škoda, VW, Audi, Seat, MB)' },
  { value: '5x108', label: '5x108 (Ford, Volvo, Peugeot)' },
  { value: '5x114.3', label: '5x114,3 (Hyundai, Kia, Mazda, Japonské)' },
  { value: '5x120', label: '5x120 (BMW, VW Transporter T5/T6)' },
  { value: '5x100', label: '5x100 (Fabia, Octavia 1, Polo, Golf 4)' },
  { value: '4x100', label: '4x100 (Citigo, Renault, Opel, Felicia)' },
  { value: '4x108', label: '4x108 (Ford, Peugeot, Citroën)' },
  { value: '5x130', label: '5x130 (VW Touareg, Porsche, Audi Q7)' },
  { value: '5x110', label: '5x110 (Opel, Alfa Romeo, Saab)' },
  { value: '5x115', label: '5x115 (Opel Astra J, Chevrolet)' },
  { value: '5x105', label: '5x105 (Opel Astra J, Mokka)' },
];
