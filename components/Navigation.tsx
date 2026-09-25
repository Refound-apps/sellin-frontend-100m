'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [role, setRole] = useState<'admin' | 'seller' | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function fetchUserRole(authUser: { id: string; email?: string | null }) {
      try {
        const cleanEmail = (authUser.email || '').toLowerCase().trim();
        const { data: credential } = await supabase
          .from('credential_pg')
          .select('role')
          .or(`user_id.eq.${authUser.id},email.ilike.${cleanEmail}`)
          .limit(1)
          .maybeSingle();

        const resolvedRole = (credential?.role as 'admin' | 'seller') ?? 'seller';
        setRole(resolvedRole);
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('seller');
      }
    }

    async function getUserAndRole() {
      try {
        setLoading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({ email: authUser.email, id: authUser.id });
          await fetchUserRole(authUser);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching user session:', err);
      } finally {
        setLoading(false);
      }
    }

    getUserAndRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email, id: session.user.id });
        await fetchUserRole(session.user);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (pathname.startsWith('/shop')) {
    return null;
  }

  // Client-side guard: hide app navigation on custom tenant domains and shop previews
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const isSystemHost =
      host === 'sellin.cz' ||
      host === 'www.sellin.cz' ||
      host === 'app.sellin.cz' ||
      host === 'bazar.sellin.cz' ||
      host === 'stage.sellin.cz' ||
      host === 'dev.sellin.cz' ||
      host === 'prodejomat.cz' ||
      host === 'www.prodejomat.cz' ||
      host === 'app.prodejomat.cz' ||
      host === 'bazar.prodejomat.cz' ||
      host === 'stage.prodejomat.cz' ||
      host === 'dev.prodejomat.cz' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.vercel.app');

    if (!isSystemHost || host.includes('.localhost') || window.location.search.includes('custom_domain=')) {
      return null;
    }
  }

  if (pathname === '/login' || pathname === '/reset-password') {
    return (
      <header className="sticky top-0 z-40 border-b border-[hsl(214_24%_88%)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-xs group-hover:scale-105 transition-transform">
              P
            </div>
            <div className="flex items-baseline">
              <span className="text-lg font-black tracking-tight text-slate-950">
                Prodej<span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">omat</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 ml-0.5">.cz</span>
            </div>
          </Link>
          <span className="text-xs font-semibold text-slate-400">
            Centrála & Sklad
          </span>
        </div>
      </header>
    );
  }

  const isAdminSection = pathname.startsWith('/admin');

  // Navigační položky pro běžné prodejce (včetně Napojení účtů a Správy e-shopu)
  const sellerNavItems = [
    { href: '/', label: 'Moje nabídka', exact: true },
    { href: '/create', label: 'Vytvořit inzerát', exact: false },
    { href: '/accounts', label: 'Napojení účtů', exact: false },
    { href: '/eshop', label: 'Správa e-shopu', exact: false },
  ];

  // Navigační položky pro administrátorské rozhraní (pouze čisté admin sekce)
  const adminNavItems = [
    { href: '/admin/offers', label: 'Nabídka', exact: false },
    { href: '/admin/transactions', label: 'Transakce', exact: false },
    { href: '/admin/automations', label: 'Automatizace & Cron', exact: false },
    { href: '/admin/users', label: 'Uživatelé', exact: false },
    { href: '/admin/eshop', label: 'E-shopy', exact: false },
    { href: '/admin/email', label: 'Test e-mail', exact: false },
  ];

  if (isAdminSection) {
    const isActive = (href: string, exact?: boolean) =>
      exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

    const renderSidebar = () => (
      <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-5">
          <Link href="/admin/offers" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-xs transition-transform group-hover:scale-105">
              P
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline">
                <span className="text-base font-black tracking-tight text-slate-950">
                  Prodej
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                    omat
                  </span>
                </span>
                <span className="ml-0.5 text-[11px] font-bold text-slate-400">.cz</span>
              </div>
              <span className="mt-0.5 inline-flex rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {adminNavItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-slate-100 px-3 py-4">
          {role === 'admin' && (
            <div
              className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]"
              role="group"
              aria-label="Režim zobrazení"
            >
              <Link
                href="/"
                className="flex-1 rounded-md px-2 py-1.5 text-center font-medium text-slate-500 transition hover:text-slate-900"
              >
                Prodejce
              </Link>
              <Link
                href="/admin/offers"
                className="flex-1 rounded-md bg-white px-2 py-1.5 text-center font-semibold text-slate-950 shadow-2xs"
              >
                Admin
              </Link>
            </div>
          )}

          {user ? (
            <div className="space-y-2 px-1">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-800">{user.email}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                  Administrátor
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Odhlásit
              </button>
            </div>
          ) : !loading ? (
            <Link
              href="/login"
              className="block rounded-lg bg-slate-950 px-3 py-2 text-center text-xs font-medium text-white"
            >
              Přihlásit
            </Link>
          ) : null}
        </div>
      </aside>
    );

    return (
      <>
        <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{renderSidebar()}</div>

        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700"
            aria-label="Otevřít menu"
          >
            Menu
          </button>
          <span className="text-sm font-bold text-slate-950">Administrace</span>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/40"
              aria-label="Zavřít menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 shadow-xl">{renderSidebar()}</div>
          </div>
        )}
      </>
    );
  }

  const currentNavItems = sellerNavItems;

  return (
    <nav className="sticky top-0 z-40 border-b border-[hsl(214_24%_88%)] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:gap-6">
          {/* Logo & Hlavní navigace */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white shadow-xs group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex items-baseline">
                <span className="text-lg font-black tracking-tight text-slate-950">
                  Prodej<span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent">omat</span>
                </span>
                <span className="text-[11px] font-bold text-slate-400 ml-0.5">.cz</span>
              </div>
            </Link>

            {/* Desktopové položky menu se shodným minimalistickým designem */}
            <div className="hidden items-center gap-1 md:flex">
              {currentNavItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[hsl(222_47%_11%)] text-white'
                        : 'text-[hsl(222_20%_38%)] hover:bg-[hsl(210_30%_94%)] hover:text-[hsl(222_47%_11%)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pravá část lišty: Subtilní Admin přepínač + Uživatel */}
          <div className="flex items-center gap-3">
            {/* Decentní, subtilní přepínač výhradně pro administrátory */}
            {role === 'admin' && (
              <div
                className="flex items-center rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/80 text-[11px]"
                role="group"
                aria-label="Režim zobrazení"
              >
                <Link
                  href="/"
                  title="Přepnout do portálu prodejce"
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    !isAdminSection
                      ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Prodejce
                </Link>
                <Link
                  href="/admin/offers"
                  title="Přepnout do administrace"
                  className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                    isAdminSection
                      ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Admin
                </Link>
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden flex-col items-end sm:flex">
                  <span className="text-xs font-medium text-slate-800">{user.email}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                      role === 'admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {role === 'admin' ? 'Administrátor' : 'Prodejce'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Odhlásit se"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                >
                  Odhlásit
                </button>
              </div>
            ) : !loading ? (
              <Link
                href="/login"
                className="rounded-full bg-[hsl(222_47%_11%)] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[hsl(222_47%_18%)]"
              >
                Přihlásit
              </Link>
            ) : null}
          </div>
        </div>

        {/* Mobilní menu */}
        <div className="flex items-center gap-1 overflow-x-auto pb-3 pt-1 md:hidden">
          {role === 'admin' && (
            <Link
              href="/admin/offers"
              className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs mr-1"
            >
              ↔ Přepnout na Admin
            </Link>
          )}
          {currentNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[hsl(222_47%_11%)] text-white'
                    : 'bg-[hsl(210_30%_94%)] text-[hsl(222_20%_38%)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
