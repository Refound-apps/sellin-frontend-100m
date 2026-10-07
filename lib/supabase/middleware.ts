import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '../database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Veřejné trasy - nevyžadují přihlášení
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/shop') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.');

  if (!user && !isPublicRoute) {
    // Nepřihlášený uživatel -> přesměrovat na /login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Session cookie: admin může přepnout na Prodejce (/); bez něj je výchozí vstup /admin/offers
  const ADMIN_VIEW_COOKIE = 'prodejomat_admin_view';

  // Pokud je přihlášen a jde na /login -> přesměrovat podle role
  // (admin defaultně do admin appky; přepínač Prodejce na / musí zůstat dostupný)
  if (user && pathname === '/login') {
    const { data: credential } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .limit(1)
      .maybeSingle();

    const role = credential?.role ?? 'seller';
    const url = request.nextUrl.clone();
    url.pathname = role === 'admin' ? '/admin/offers' : '/';
    return NextResponse.redirect(url);
  }

  // 2. Kontrola admin tras (/admin/users, /admin/transactions a legacy přesměrování)
  const isLegacyAdminRoute =
    pathname === '/users' ||
    pathname.startsWith('/users/') ||
    pathname === '/transactions' ||
    pathname.startsWith('/transactions/');

  const isAdminRoute = pathname.startsWith('/admin') || isLegacyAdminRoute;

  if (user && (isAdminRoute || pathname === '/')) {
    const { data: credential } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .limit(1)
      .maybeSingle();

    const role = credential?.role ?? 'seller';

    // První náběh admina na / → /admin/offers (Prodejce přepínač nastaví cookie a / pak nechá)
    if (role === 'admin' && pathname === '/') {
      const prefersSeller = request.cookies.get(ADMIN_VIEW_COOKIE)?.value === 'seller';
      if (!prefersSeller) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/offers';
        return NextResponse.redirect(url);
      }
    }

    if (isAdminRoute) {
      if (role !== 'admin') {
        // Uživatel není admin -> přesměrovat na domovskou stránku /
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }

      // Pro administrátora přesměrovat případné staré URL na /admin/*
      if (isLegacyAdminRoute || pathname === '/admin' || pathname === '/admin/') {
        const url = request.nextUrl.clone();
        if (pathname === '/admin' || pathname === '/admin/') {
          url.pathname = '/admin/offers';
        } else if (pathname.startsWith('/users')) {
          url.pathname = pathname.replace(/^\/users/, '/admin/users');
        } else if (pathname.startsWith('/transactions')) {
          url.pathname = pathname.replace(/^\/transactions/, '/admin/transactions');
        }
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
