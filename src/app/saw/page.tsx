'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

interface RecommendationDetail {
  id?: number;
  car_id: number;
  rank: number;
  price_score: number;
  category_score: number;
  trans_score: number;
  fuel_score: number;
  year_score: number;
  final_score: number;
  match_percentage: number;
  reason: string;
  car: {
    id: number;
    model_name: string;
    year: number;
    price: number;
    mileage: number;
    transmission: string;
    fuel_type: string;
    brand?: { name: string };
    category?: { name: string };
  };
}

export default function SawRecommendationPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state sesuai struct SAWInput di Go
  const [minBudget, setMinBudget] = useState<string>('100000000');
  const [maxBudget, setMaxBudget] = useState<string>('250000000');
  const [preferredCategoryId, setPreferredCategoryId] = useState<number>(0);
  const [preferredTrans, setPreferredTrans] = useState<string>('Bebas');
  const [preferredFuel, setPreferredFuel] = useState<string>('Bebas');
  const [priority, setPriority] = useState<string>('harga_terjangkau');

  const [results, setResults] = useState<RecommendationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const catRes = await apiFetch('/categories');
        const catList = Array.isArray(catRes) ? catRes : catRes?.data || [];
        setCategories(catList);
      } catch {
        // Abaikan jika gagal memuat kategori
      }

      // Jika user sudah login, muat riwayat rekomendasi terakhir otomatis
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const histRes = await apiFetch('/buyer/recommendations/history');
          const histList = Array.isArray(histRes) ? histRes : histRes?.data || [];
          if (histList.length > 0 && Array.isArray(histList[0].details)) {
            setResults(histList[0].details);
          }
        } catch {
          // Riwayat kosong
        }
      }
    }

    loadInitialData();
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu untuk menghitung rekomendasi SAW.');
      router.push('/login');
      return;
    }

    const parsedMin = Number(minBudget) || 0;
    const parsedMax = Number(maxBudget);

    if (!parsedMax || parsedMax <= 0) {
      setError('Batas maksimal budget wajib diisi dengan benar.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        budget_range: `Rp ${parsedMin.toLocaleString('id-ID')} - Rp ${parsedMax.toLocaleString('id-ID')}`,
        min_budget: parsedMin,
        max_budget: parsedMax,
        preferred_category_id: Number(preferredCategoryId),
        preferred_transmission: preferredTrans,
        preferred_fuel: preferredFuel,
        priority: priority,
      };

      const res = await apiFetch('/buyer/recommendations/calculate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const details = res?.data?.details || res?.details || [];
      setResults(details);
    } catch (err: any) {
      setError(err.message || 'Gagal menghitung rekomendasi SAW');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Sistem Rekomendasi Mobil (Metode SAW)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Masukkan budget, preferensi spesifikasi, dan prioritas utama Anda untuk mendapatkan 5 rekomendasi unit terbaik.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Panel Kiri: Form Preferensi Pembeli */}
          <form
            onSubmit={handleCalculate}
            className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 h-fit space-y-4"
          >
            <h2 className="text-base font-semibold text-white pb-3 border-b border-slate-800">
              Preferensi & Kriteria Anda
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Budget Minimal (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000000}
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Budget Maksimal (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={10000000}
                  step={5000000}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kategori Mobil
              </label>
              <select
                value={preferredCategoryId}
                onChange={(e) => setPreferredCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value={0}>Semua Kategori (Bebas)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Transmisi
                </label>
                <select
                  value={preferredTrans}
                  onChange={(e) => setPreferredTrans(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Bebas">Bebas</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Bahan Bakar
                </label>
                <select
                  value={preferredFuel}
                  onChange={(e) => setPreferredFuel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Bebas">Bebas</option>
                  <option value="Bensin">Bensin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Listrik">Listrik</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prioritas Utama Pembobotan SAW
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="harga_terjangkau">Harga Paling Terjangkau</option>
                <option value="kapasitas">Kapasitas Penumpang & Keluarga</option>
                <option value="irit_bbm">Konsumsi BBM Paling Irit</option>
                <option value="performa">Performa Mesin & Tahun Muda</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition cursor-pointer"
            >
              {loading ? 'Menghitung Perankingan...' : 'Cari Rekomendasi Terbaik'}
            </button>
          </form>

          {/* Panel Kanan: Top 5 Hasil Perankingan */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-base font-semibold text-white">
              Top Rekomendasi Unit Terbaik
            </h2>

            {results.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-10 text-center">
                <p className="text-slate-400 text-sm">
                  Isi preferensi budget & prioritas Anda di sebelah kiri, lalu klik{' '}
                  <strong className="text-slate-200">Cari Rekomendasi Terbaik</strong>.
                </p>
              </div>
            ) : (
              results.map((item, index) => {
                const carData = item.car;
                const rankNumber = item.rank || index + 1;

                return (
                  <div
                    key={item.car_id || index}
                    className={`rounded-xl border p-5 transition ${
                      rankNumber === 1
                        ? 'bg-blue-950/20 border-blue-500/60'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            rankNumber === 1
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          #{rankNumber}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">
                              {carData?.brand?.name ? `${carData.brand.name} ` : ''}
                              {carData?.model_name}
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                              Cocok {item.match_percentage}%
                            </span>
                          </div>

                          <p className="text-base font-bold text-emerald-400 mt-1">
                            Rp {Number(carData?.price || 0).toLocaleString('id-ID')}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            Tahun {carData?.year} • {carData?.transmission} •{' '}
                            {carData?.fuel_type} • {carData?.mileage?.toLocaleString('id-ID')} km
                          </p>

                          {item.reason && (
                            <p className="text-xs text-slate-300 mt-2.5 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                              {item.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 shrink-0">
                        <div className="text-right">
                          <span className="block text-[10px] uppercase text-slate-500">
                            Skor SAW
                          </span>
                          <span className="text-lg font-bold text-blue-400">
                            {Number(item.final_score || 0).toFixed(4)}
                          </span>
                        </div>
                        {carData?.id && (
                          <Link
                            href={`/cars/${carData.id}`}
                            className="mt-2 text-xs text-blue-400 hover:underline font-medium"
                          >
                            Lihat Detail →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}