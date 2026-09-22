import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const MAIN_DOMAINS = new Set([
  'sellin.cz',
  'www.sellin.cz',
  'app.sellin.cz',
  'bazar.sellin.cz',
  'stage.sellin.cz',
  'dev.sellin.cz',
  'prodejomat.cz',
  'www.prodejomat.cz',
  'app.prodejomat.cz',
  'bazar.prodejomat.cz',
  'stage.prodejomat.cz',
  'dev.prodejomat.cz',
  'localhost',
  '127.0.0.1',
]);

const INTERNAL_BLOCKED_PATHS = [
  '/admin',
  '/login',
  '/accounts',
  '/create',
  '/eshop',
  '/users',
  '/transactions',
  '/reset-password',
  '/auth',
];

export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const host = rawHost.toLowerCase().split(':')[0].trim();
  const { pathname } = request.nextUrl;

  // Determine if this is a tenant custom domain or tenant subdomain
  let isTenant = false;
  let tenantIdentifier = '';

  if (host.includes('.localhost')) {
    // Local testing: e.g. alubazarplzen.localhost:3000 or alubazar-plzen.localhost:3000
    isTenant = true;
    tenantIdentifier = host.split('.localhost')[0];
  } else if (host.endsWith('.sellin.cz')) {
    const subdomain = host.replace('.sellin.cz', '');
    if (!['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain)) {
      isTenant = true;
      tenantIdentifier = subdomain;
    }
  } else if (host.endsWith('.prodejomat.cz')) {
    const subdomain = host.replace('.prodejomat.cz', '');
    if (!['app', 'www', 'stage', 'dev', 'bazar'].includes(subdomain)) {
      isTenant = true;
      tenantIdentifier = subdomain;
    }
  } else if (!MAIN_DOMAINS.has(host) && !host.endsWith('.vercel.app')) {
    // Custom domain like alubazarplzen.cz or www.alubazarplzen.cz
    isTenant = true;
    tenantIdentifier = host.replace(/^www\./, '');
  }

  // Allow developer override via header or query param for previewing
  const overrideDomain = request.nextUrl.searchParams.get('custom_domain') || request.headers.get('x-shop-domain');
  if (overrideDomain) {
    tenantIdentifier = overrideDomain.toLowerCase().trim();
  }

  // --- TENANT DOMAIN ROUTING (e.g. alubazarplzen.cz) ---
  if (isTenant) {
    // 1. Security: Block internal Sellin admin / management routes
    for (const blocked of INTERNAL_BLOCKED_PATHS) {
      if (pathname === blocked || pathname.startsWith(`${blocked}/`)) {
        return new NextResponse('Stránka nenalezena', { status: 404 });
      }
    }

    // 2. Prepare headers with tenant identification
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-shop-domain', tenantIdentifier);

    // 3. API & static paths pass through directly
    if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // 4. Storefront paths rewriting:
    // If user accesses root "/" -> rewrite to "/shop"
    // If user accesses "/kontakt" -> rewrite to "/shop/kontakt"
    // If already on "/shop..." -> keep path
    const rewriteUrl = request.nextUrl.clone();
    if (pathname === '/') {
      rewriteUrl.pathname = '/shop';
    } else if (!pathname.startsWith('/shop')) {
      rewriteUrl.pathname = `/shop${pathname}`;
    }

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // --- MAIN APP ROUTING (sellin.cz, app.sellin.cz, localhost) ---
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons etc. with extension)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
