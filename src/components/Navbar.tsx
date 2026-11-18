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
          setUser({ name: 'User' });
        }
      } else if (token) {
        setUser({ name: 'User' });
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
    `text-sm font-medium transition ${
      pathname === href
        ? 'text-blue-400'
        : 'text-slate-300 hover:text-white'
    }`;

  const isStaff = user?.role === 'admin' || user?.role === 'sales';

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          AutoDrive <span className="text-blue-500">Showroom</span>
        </Link>

        {/* Menu Navigasi */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className={navLinkClass('/')}>
            Katalog Mobil
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
              Dashboard {user?.role === 'admin' ? 'Admin' : 'Sales'}
            </Link>
          )}
        </div>

        {/* Tombol Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline-block text-xs text-slate-400">
                Halo, <strong className="text-slate-200">{user.name || user.email}</strong>
                {user.role && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] uppercase text-blue-400">
                    {user.role}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}