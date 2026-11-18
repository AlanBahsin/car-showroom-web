'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      alert('Registrasi berhasil! Silakan masuk menggunakan akun Anda.');
      router.push('/login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftarkan akun baru.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12 bg-[#090b10]">
      <div className="w-full max-w-md rounded-2xl bg-[#10131c] border border-white/10 p-8 shadow-2xl">
        <div className="text-center mb-7">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-lg mx-auto shadow-lg shadow-amber-500/20">
            A
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">Registrasi Member Baru</h1>
          <p className="text-slate-400 text-xs mt-1">
            Dapatkan akses jadwal test drive, wishlist, dan analisis rekomendasi SAW
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Muhammad Farhan"
              className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Alamat Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Nomor Telepon / WhatsApp</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081234567890"
              className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Kata Sandi *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-3 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer mt-2"
          >
            {loading ? 'Mendaftarkan...' : 'Buat Akun Member'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}