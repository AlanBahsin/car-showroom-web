'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Car {
  id: number;
  model_name: string;
  year: number;
  price: number;
  condition: string;
  mileage: number;
  transmission: string;
  fuel_type: string;
  color: string;
  status: string;
  brand?: { name: string };
  category?: { name: string };
}

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCars() {
      try {
        const res = await apiFetch('/cars');
        console.log('Response asli dari backend Go:', res);

        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.cars)
          ? res.data.cars
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.cars)
          ? res.cars
          : [];

        setCars(list);
      } catch (err: any) {
        setError(err.message || 'Gagal mengambil data dari backend Go');
      } finally {
        setLoading(false);
      }
    }

    loadCars();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-800 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              AutoDrive <span className="text-blue-500">Showroom</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Katalog Mobil & Sistem Rekomendasi SAW
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            API: localhost:8080
          </span>
        </header>

        {loading && (
          <p className="text-slate-400 animate-pulse">Memuat daftar mobil dari server...</p>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
            <strong>Koneksi Gagal:</strong> {error}
            <p className="mt-1 text-xs text-red-400">
              Pastikan server Go di port 8080 sudah menyala dan CORS mengizinkan localhost:3000.
            </p>
          </div>
        )}

        {!loading && !error && cars.length === 0 && (
          <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-center">
            Koneksi ke backend Go berhasil, tetapi data mobil di database masih kosong.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(cars) &&
            cars.map((car) => (
              <div
                key={car.id}
                className="rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-blue-500/60 transition"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>
                    {car.brand?.name || 'Brand'} • {car.year}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase font-medium">
                    {car.status || 'available'}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white">{car.model_name}</h2>
                <p className="text-xl font-bold text-emerald-400 mt-2">
                  Rp {Number(car.price).toLocaleString('id-ID')}
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>{car.transmission}</span>
                  <span>{car.fuel_type}</span>
                  <span>{car.mileage?.toLocaleString('id-ID')} km</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}