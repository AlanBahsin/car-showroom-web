'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserInfo {
  name?: string;
  email?: string;
  role?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser({ name: 'Member' });
        }
      } else if (token) {
        setUser({ name: 'Member' });
      } else {
        setUser(null);
      }
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const navLinkClass = (href: string) =>
    `relative py-1 text-xs uppercase tracking-widest font-semibold transition-colors ${
      pathname === href
        ? 'text-amber-400 after:content-[""] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:bg-amber-400'
        : 'text-slate-300 hover:text-white'
    }`;

  const isStaff = user?.role === 'admin' || user?.role === 'sales';

  return (
    <nav className="sticky top-0 z-50 bg-[#090b10]/85 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-amber-500/20">
            A
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider text-white uppercase block leading-none">
              AutoDrive
            </span>
            <span className="text-[10px] tracking-[0.28em] text-amber-400/90 uppercase block mt-1">
              Prestige Motors
            </span>
          </div>
        </Link>

        {/* Menu Navigasi */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className={navLinkClass('/')}>
            Koleksi Unit
          </Link>
          <Link href="/saw" className={navLinkClass('/saw')}>
            Rekomendasi SAW
          </Link>
          {user && (
            <Link href="/bookings" className={navLinkClass('/bookings')}>
              Aktivitas Saya
            </Link>
          )}
          {isStaff && (
            <Link href="/admin" className={navLinkClass('/admin')}>
              Portal {user?.role === 'admin' ? 'Admin' : 'Sales'}
            </Link>
          )}
        </div>

        {/* Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-200 font-medium">{user.name || user.email}</span>
                {user.role && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] uppercase font-bold">
                    {user.role}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white/5 text-slate-300 border border-white/10 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30 transition cursor-pointer"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-300 hover:text-white transition"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-linear-to-r from-amber-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-amber-400 shadow-lg shadow-amber-500/20 transition"
              >
                Daftar Member
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}