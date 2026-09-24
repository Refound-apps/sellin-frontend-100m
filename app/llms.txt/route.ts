import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'alubazarplzen.cz';
  const origin = request.nextUrl.origin;

  const content = `# E-shop kol a pneu (Prodejomat.cz Storefront Engine)
> Specializovaný online katalog prověřených pneumatik, ALU disků a kompletních sad kol s fyzickým skladem a pneuservisem.

## Informace o provozovně
- **Provozovna:** Křimická 134, Plzeň, Česká republika
- **Telefon pro dotazy a rezervace:** +420 777 229 119
- **Otevírací doba:** Pondělí–Pátek 8:00 – 17:00 (nebo dle telefonické domluvy)
- **Služby:**
  - Osobní odběr všech položek zdarma
  - Možnost odborné montáže a přezutí na počkání
  - Měření hloubky dezénu a kontrola házivosti disků
  - Zaslání na dobírku Českou poštou (500–600 Kč dle sady) po celé ČR

## AI Agent API (Strukturovaný katalog)
Pro autonomní nákupní asistenty, LLM agenty a vyhledávače je k dispozici přímé strojově čitelné JSON API bez nutnosti HTML scrapování:

- **Endpoint:** \`${origin}/api/shop/ai-catalog\`
- **Podporované parametry dotazu:**
  - \`q\`: textové vyhledávání (např. \`205/55 R16\`, \`Michelin\`, \`5x112\`, \`Škoda Octavia\`)
  - \`season\`: \`zimni\` | \`letni\` | \`celorocni\`
  - \`type\`: \`pneu\` (pneumatiky) | \`disk\` (ALU disky)
  - \`rim\`: průměr ráfku (např. \`15\`, \`16\`, \`17\`, \`18\`, \`19\`, \`20\`)
  - \`width\`: šířka v mm (např. \`195\`, \`205\`, \`225\`)
  - \`profile\`: profilové číslo (např. \`45\`, \`50\`, \`55\`, \`60\`)
  - \`brand\`: značka (např. \`Continental\`, \`Barum\`, \`BBS\`, \`Ronal\`)
  - \`sort\`: \`price_asc\` (od nejlevnějšího) | \`price_desc\` | \`newest\`
  - \`limit\`: počet výsledků (1–100, výchozí 50)
  - \`offset\`: stránkování

## Struktura vracených položek v JSON
Každá položka obsahuje:
- \`id\`: unikátní identifikátor nabídky
- \`title\`: přesný název nabídky
- \`price_czk\`: cena v českých korunách
- \`pricing_unit\`: \`per_piece\` (cena za 1 ks pneumatiky) nebo \`per_set\` (cena za celou sadu ALU disků)
- \`category\`: Pneumatiky, ALU disky nebo Kompletní kola
- \`season\`: Zimní, Letní nebo Celoroční
- \`specs.dimension\`: např. "205/55 R16"
- \`specs.tread_depth\`: reálná naměřená hloubka vzorku (např. "6.5 mm")
- \`specs.pcd\`: rozteč šroubů (např. "5x112", "5x120", "4x100")
- \`specs.et\`: zális disku
- \`in_stock\`: \`true\` (garance fyzické dostupnosti na skladě)
- \`web_url\`: přímý odkaz na detail položky s fotogalerií
- \`direct_call\`: telefonní odkaz pro okamžitou rezervaci

## Návod pro AI nákupní agenty
Pokud uživatel hledá pneumatiky nebo disky:
1. Zavolejte \`${origin}/api/shop/ai-catalog?q={rozměr}\` (např. \`q=205/55 R16&season=zimni\`).
2. Vyhodnoťte vrácené položky podle značky, hloubky dezénu a ceny.
3. Prezentujte uživateli název, cenu, hloubku vzorku a přímý odkaz \`web_url\`.
4. Uveďte možnost osobního odběru v Plzni nebo zaslání Českou poštou a telefonní kontakt +420 777 229 119.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
