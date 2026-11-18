'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface RecommendationResult {
  car_id?: number;
  id?: number;
  model_name?: string;
  brand_name?: string;
  price?: number;
  year?: number;
  score?: number;
  total_score?: number;
  preference_value?: number;
  rank?: number;
  car?: {
    id: number;
    model_name: string;
    year: number;
    price: number;
    transmission: string;
    fuel_type: string;
    mileage: number;
    brand?: { name: string };
  };
}

interface HistoryItem {
  id: number;
  created_at?: string;
  weight_price?: number;
  weight_year?: number;
  weight_mileage?: number;
  weight_fuel?: number;
  weight_capacity?: number;
  results?: RecommendationResult[];
}

function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.results)) return raw.data.results;
  if (Array.isArray(raw?.data?.recommendations)) return raw.data.recommendations;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  return [];
}

export default function SawRecommendationPage() {
  const router = useRouter();

  // Bobot Kriteria SAW (1 - 5)
  const [weightPrice, setWeightPrice] = useState<number>(5);
  const [weightYear, setWeightYear] = useState<number>(4);
  const [weightMileage, setWeightMileage] = useState<number>(4);
  const [weightFuel, setWeightFuel] = useState<number>(3);
  const [weightCapacity, setWeightCapacity] = useState<number>(3);

  // Filter Opsional
  const [maxBudget, setMaxBudget] = useState<string>('');
  const [minSeats, setMinSeats] = useState<string>('');

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [calculating, setCalculating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const res = await apiFetch('/buyer/recommendations/history');
      setHistory(extractArray(res));
    } catch {
      // Abaikan jika riwayat kosong
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadHistory();
  }, []);

  const totalWeight = weightPrice + weightYear + weightMileage + weightFuel + weightCapacity;

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCalculating(true);

    try {
      const payload: any = {
        weight_price: Number(weightPrice),
        weight_year: Number(weightYear),
        weight_mileage: Number(weightMileage),
        weight_fuel: Number(weightFuel),
        weight_capacity: Number(weightCapacity),
      };

      if (maxBudget && Number(maxBudget) > 0) payload.max_budget = Number(maxBudget);
      if (minSeats && Number(minSeats) > 0) payload.min_seats = Number(minSeats);

      const res = await apiFetch('/buyer/recommendations/calculate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const list = extractArray(res);
      setResults(list);
      await loadHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghitung rekomendasi SAW.');
    } finally {
      setCalculating(false);
    }
  };

  const criteriaSliders = [
    {
      label: 'Harga OTR (Cost)',
      desc: 'Prioritas harga semakin terjangkau',
      value: weightPrice,
      setter: setWeightPrice,
    },
    {
      label: 'Tahun Produksi (Benefit)',
      desc: 'Prioritas keluaran tahun terbaru',
      value: weightYear,
      setter: setWeightYear,
    },
    {
      label: 'Jarak Tempuh / KM (Cost)',
      desc: 'Prioritas odometer rendah',
      value: weightMileage,
      setter: setWeightMileage,
    },
    {
      label: 'Efisiensi BBM (Benefit)',
      desc: 'Prioritas konsumsi bahan bakar irit',
      value: weightFuel,
      setter: setWeightFuel,
    },
    {
      label: 'Kapasitas Kursi (Benefit)',
      desc: 'Prioritas daya tampung penumpang',
      value: weightCapacity,
      setter: setWeightCapacity,
    },
  ];

  return (
    <main className="min-h-screen px-6 py-10 bg-[#090b10]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <span className="text-[11px] uppercase tracking-[0.22em] text-amber-400 font-semibold">
            Decision Support System
          </span>
          <h1 className="text-3xl font-bold text-white mt-1">
            Rekomendasi Unit Cerdas (Metode SAW)
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Atur tingkat prioritas setiap kriteria dari skala <strong className="text-slate-200">1 (Rendah)</strong> hingga{' '}
            <strong className="text-amber-300">5 (Sangat Penting)</strong> untuk mendapatkan peringkat unit terbaik secara objektif.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Bobot Kriteria */}
          <form
            onSubmit={handleCalculate}
            className="lg:col-span-5 rounded-2xl bg-[#10131c] border border-white/10 p-6 space-y-5 h-fit"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white">Preferensi & Bobot Kriteria</h2>
              <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-[11px] font-bold text-amber-300">
                Total Bobot: {totalWeight}
              </span>
            </div>

            <div className="space-y-4">
              {criteriaSliders.map((item) => {
                const pct = totalWeight > 0 ? Math.round((item.value / totalWeight) * 100) : 0;
                return (
                  <div key={item.label} className="p-3.5 rounded-xl bg-[#090b10] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{item.label}</span>
                      <span className="text-xs font-bold text-amber-400">
                        Skala {item.value}/5 ({pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{item.desc}</p>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={item.value}
                      onChange={(e) => item.setter(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Maksimal Budget (Opsional)</label>
                <input
                  type="number"
                  step={5000000}
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="Contoh: 300000000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Min. Kursi (Opsional)</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={minSeats}
                  onChange={(e) => setMinSeats(e.target.value)}
                  placeholder="Contoh: 5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={calculating}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              {calculating ? 'Menganalisis Unit...' : 'Hitung Peringkat Terbaik'}
            </button>
          </form>

          {/* Hasil Perankingan & Riwayat */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Hasil Peringkat Rekomendasi</h2>

              {results.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#10131c] border border-dashed border-white/10 text-center">
                  <p className="text-slate-400 text-sm">
                    Atur bobot preferensi di samping, lalu klik <strong className="text-amber-300">Hitung Peringkat Terbaik</strong> untuk melihat urutan unit paling sesuai.
                  </p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const carObj = item.car;
                  const targetCarId = carObj?.id || item.car_id || item.id;
                  const carTitle = carObj
                    ? `${carObj.brand?.name ? `${carObj.brand.name} ` : ''}${carObj.model_name}`
                    : `${item.brand_name ? `${item.brand_name} ` : ''}${item.model_name || `Unit #${targetCarId}`}`;
                  const carPrice = carObj?.price ?? item.price ?? 0;
                  const carYear = carObj?.year ?? item.year;
                  const rawScore = item.score ?? item.total_score ?? item.preference_value ?? 0;

                  return (
                    <div
                      key={`${targetCarId}-${idx}`}
                      className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        idx === 0
                          ? 'bg-linear-to-r from-amber-500/10 via-[#10131c] to-[#10131c] border-amber-400/50 shadow-xl shadow-amber-500/5'
                          : 'bg-[#10131c] border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-white/10 text-slate-200'
                          }`}
                        >
                          #{item.rank || idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{carTitle}</h3>
                            {idx === 0 && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                Best Match
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-amber-400 mt-1">
                            Rp {Number(carPrice).toLocaleString('id-ID')}
                            {carYear ? <span className="text-xs text-slate-400 font-normal"> • Tahun {carYear}</span> : ''}
                          </p>
                          {carObj && (
                            <p className="text-xs text-slate-400 mt-1">
                              {carObj.transmission} • {carObj.fuel_type} •{' '}
                              {Number(carObj.mileage || 0).toLocaleString('id-ID')} km
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                            Skor Preferensi
                          </span>
                          <strong className="text-lg font-mono font-bold text-emerald-400">
                            {Number(rawScore).toFixed(4)}
                          </strong>
                        </div>

                        {targetCarId && (
                          <Link
                            href={`/cars/${targetCarId}`}
                            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-amber-400 text-white hover:text-slate-950 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Lihat Unit
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Riwayat Analisis SAW */}
            {!loadingHistory && history.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Riwayat Analisis Terakhir ({history.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.slice(0, 4).map((h) => (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl bg-[#10131c] border border-white/10 text-xs space-y-1"
                    >
                      <div className="flex justify-between text-amber-400 font-semibold">
                        <span>Sesi Analisis #{h.id}</span>
                        {h.created_at && (
                          <span className="text-slate-500 font-normal">
                            {new Date(h.created_at).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400">
                        Bobot: Harga ({h.weight_price}), Tahun ({h.weight_year}), KM ({h.weight_mileage})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}