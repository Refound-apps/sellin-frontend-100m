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
    async function getUserAndRole() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          setUser({ email: authUser.email, id: authUser.id });

          // Fetch user role from credential_pg
          const { data: credential } = await supabase
            .from('credential_pg')
            .select('role')
            .or(`user_id.eq.${authUser.id},email.ilike.${authUser.email}`)
            .limit(1)
            .maybeSingle();

          setRole((credential?.role as 'admin' | 'seller') ?? 'seller');
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email, id: session.user.id });
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

  if (pathname === '/login' || pathname === '/reset-password') {
    return (
      <header className="sticky top-0 z-40 border-b border-[hsl(214_24%_88%)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-[hsl(222_47%_11%)]">
            Sellin
          </Link>
          <Link
            href="/shop"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Přejít do E-shopu →
          </Link>
        </div>
      </header>
    );
  }

  const baseItems = [
    { href: '/', label: 'Moje nabídka' },
    { href: '/create', label: 'Vytvořit inzerát' },
  ];

  const adminItems = [
    { href: '/users', label: 'Uživatelé' },
    { href: '/accounts', label: 'Napojení účtů' },
    { href: '/transactions', label: 'Transakce' },
  ];

  const navItems = [
    ...baseItems,
    ...(role === 'admin' ? adminItems : []),
    { href: '/shop', label: 'E-shop' },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-[hsl(214_24%_88%)] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-[hsl(222_47%_11%)]">
              Sellin
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
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

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden flex-col items-end sm:flex">
                  <span className="text-xs font-medium text-slate-800">{user.email}</span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-slate-600">
                    {role === 'admin' ? 'Administrátor' : 'Prodejce'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Odhlásit se"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
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

        <div className="flex gap-1 overflow-x-auto pb-3 md:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
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
