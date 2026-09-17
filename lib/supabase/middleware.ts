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

  // Pokud je přihlášen a jde na /login -> přesměrovat na dashboard /
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 2. Kontrola admin tras (/users, /accounts, /transactions)
  const isAdminRoute =
    pathname.startsWith('/users') ||
    pathname.startsWith('/accounts') ||
    pathname.startsWith('/transactions');
  if (user && isAdminRoute) {
    const { data: credential } = await supabase
      .from('credential_pg')
      .select('role')
      .or(`user_id.eq.${user.id},email.ilike.${user.email}`)
      .limit(1)
      .maybeSingle();

    const role = credential?.role ?? 'seller';
    if (role !== 'admin') {
      // Uživatel není admin -> přesměrovat na domovskou stránku /
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
