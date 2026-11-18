'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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

  // State untuk Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [transmissionFilter, setTransmissionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadCars() {
      try {
        const res = await apiFetch('/cars');
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

  // Filter daftar mobil secara instan di sisi frontend
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const keyword = searchQuery.toLowerCase();
      const matchName =
        car.model_name?.toLowerCase().includes(keyword) ||
        car.brand?.name?.toLowerCase().includes(keyword);

      const matchTransmission =
        transmissionFilter === 'ALL' ||
        car.transmission?.toLowerCase() === transmissionFilter.toLowerCase();

      const matchStatus =
        statusFilter === 'ALL' ||
        car.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchName && matchTransmission && matchStatus;
    });
  }, [cars, searchQuery, transmissionFilter, statusFilter]);

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white">Katalog Mobil Pilihan</h1>
          <p className="text-slate-400 text-sm mt-1">
            Temukan unit terbaik atau gunakan fitur Rekomendasi SAW untuk perhitungan objektif.
          </p>
        </header>

        {/* Bar Pencarian & Filter */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari merek atau model mobil..."
            className="md:col-span-2 px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
          />

          <select
            value={transmissionFilter}
            onChange={(e) => setTransmissionFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Transmisi</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        {loading && (
          <p className="text-slate-400 animate-pulse">Memuat daftar mobil dari server...</p>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-sm">
            <strong>Koneksi Gagal:</strong> {error}
          </div>
        )}

        {!loading && !error && filteredCars.length === 0 && (
          <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center text-sm">
            Tidak ada mobil yang cocok dengan kriteria pencarian.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCars.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.id}`}
              className="group block rounded-xl bg-slate-900 border border-slate-800 p-5 hover:border-blue-500/70 hover:bg-slate-900/90 transition"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>
                  {car.brand?.name || 'Brand'} • {car.year}
                </span>
                <span
                  className={`px-2 py-0.5 rounded uppercase font-medium ${
                    car.status === 'available'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {car.status || 'available'}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition">
                {car.model_name}
              </h2>

              <p className="text-xl font-bold text-emerald-400 mt-2">
                Rp {Number(car.price).toLocaleString('id-ID')}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>{car.transmission}</span>
                <span>{car.fuel_type}</span>
                <span>{car.mileage?.toLocaleString('id-ID')} km</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}