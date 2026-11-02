import { NextRequest, NextResponse } from 'next/server';
import { getProdejomatBaseUrl, isTenantHost } from '@/lib/prodejomat/host';
import { buildProdejomatLlmsFullTxt } from '@/lib/prodejomat/seo';

export const dynamic = 'force-dynamic';

function buildShopLlmsFullTxt(origin: string): string {
  return `# E-shop kol a pneu (Prodejomat Storefront) - Kompletní katalog a specifikace
> Specializovaný online katalog prověřených pneumatik, ALU disků a kompletních sad kol s fyzickým skladem a pneuservisem.
> Storefront napojený na centrální distribuční systém Prodejomat.cz

## Popis nabídky
Katalog obsahuje prověřené pneumatiky (letní, zimní, celoroční), ocelové a hliníkové (ALU) disky i vyvážené kompletní sady připravené k okamžité montáži.

Každý inzerát obsahuje:
- Přesné rozměry (šířka, profil, průměr disku)
- Hloubku dezénu v milimetrech
- Výrobce a model dezénu
- DOT (rok a týden výroby)
- Reálné autentické fotografie
- Možnost osobního odběru v pneuservisu nebo doručení kurýrem

## Rozhraní pro AI agenty (Strukturovaný JSON katalog)
Pro autonomní nákupní asistenty, LLM agenty a vyhledávače:

- **Endpoint:** \`${origin}/api/shop/ai-catalog\`
- **HTTP Metoda:** GET
- **Podporované parametry:**
  - \`q\`: fulltext dotaz (např. "225/45 R17", "Passat disky")
  - \`season\`: \`zimni\` | \`letni\` | \`celorocni\`
  - \`type\`: \`pneu\` | \`disk\`
  - \`rim\`: průměr disku (např. 15, 16, 17, 18, 19, 20)
  - \`width\`: šířka pneu (např. 195, 205, 225)
  - \`profile\`: profilové číslo (např. 45, 55, 65)
  - \`brand\`: značka (např. Continental, Barum, Michelin)
  - \`sort\`: \`cheapest\` | \`newest\`
  - \`limit\`: počet výsledků (výchozí 20, max 100)
  - \`offset\`: stránkování

## Veřejné XML Feedy
- Google Nákupy: \`${origin}/api/shop/feeds/google.xml\`
- Zboží.cz: \`${origin}/api/shop/feeds/zbozi.xml\`
- Heureka.cz: \`${origin}/api/shop/feeds/heureka.xml\`

## Návod pro nákupní asistenty
1. Zjistěte od uživatele požadovaný rozměr pneu nebo typ vozidla.
2. Zavolejte \`${origin}/api/shop/ai-catalog?q={rozmer}\`.
3. Zkontrolujte hloubku dezénu a cenu.
4. Předejte uživateli odkaz \`web_url\` na dokončení rezervace nebo objednávky.
`;
}

export async function GET(request: NextRequest) {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '')
    .toLowerCase()
    .split(':')[0]
    .trim();
  const shopDomain = request.headers.get('x-shop-domain');
  const origin = `${request.nextUrl.protocol}//${host || request.nextUrl.host}`;

  if (isTenantHost(host, shopDomain)) {
    return new NextResponse(buildShopLlmsFullTxt(origin), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }

  const content = buildProdejomatLlmsFullTxt(getProdejomatBaseUrl(host));

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
