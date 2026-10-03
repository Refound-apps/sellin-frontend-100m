import { NextRequest, NextResponse } from 'next/server';
import { getProdejomatBaseUrl, isTenantHost } from '@/lib/prodejomat/host';
import { buildProdejomatLlmsTxt } from '@/lib/prodejomat/seo';

export const dynamic = 'force-dynamic';

function buildShopLlmsTxt(origin: string): string {
  return `# E-shop kol a pneu (Prodejomat Storefront)
> Specializovaný online katalog prověřených pneumatik, ALU disků a kompletních sad kol s fyzickým skladem a pneuservisem.

## AI Agent API (Strukturovaný katalog)
Pro autonomní nákupní asistenty, LLM agenty a vyhledávače:

- **Endpoint:** \`${origin}/api/shop/ai-catalog\`
- **Parametry:** \`q\`, \`season\` (zimni|letni|celorocni), \`type\` (pneu|disk), \`rim\`, \`width\`, \`profile\`, \`brand\`, \`sort\`, \`limit\`, \`offset\`

## Návod pro AI nákupní agenty
1. Zavolejte \`${origin}/api/shop/ai-catalog?q={rozměr}\`.
2. Vyhodnoťte značku, hloubku dezénu a cenu.
3. Ukažte \`web_url\` na detail produktu a možnost osobního odběru / zásilky.
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
    return new NextResponse(buildShopLlmsTxt(origin), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  }

  const content = buildProdejomatLlmsTxt(getProdejomatBaseUrl(host));

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
