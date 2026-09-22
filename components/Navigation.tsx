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
  ];

  const currentNavItems = isAdminSection ? adminNavItems : sellerNavItems;

  return (
    <nav className="sticky top-0 z-40 border-b border-[hsl(214_24%_88%)] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:gap-6">
          {/* Logo & Hlavní navigace */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href={isAdminSection ? '/admin/offers' : '/'}
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
              {isAdminSection && (
                <span className="rounded bg-[hsl(222_47%_11%)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ml-1">
                  Admin
                </span>
              )}
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
              href={isAdminSection ? '/' : '/admin/offers'}
              className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs mr-1"
            >
              {isAdminSection ? '↔ Přepnout na Prodejce' : '↔ Přepnout na Admin'}
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
