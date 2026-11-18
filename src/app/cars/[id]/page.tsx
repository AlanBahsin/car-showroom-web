'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface CarDetail {
  id: number;
  model_name: string;
  year: number;
  price: number;
  condition: string;
  mileage: number;
  transmission: string;
  fuel_type: string;
  color: string;
  engine_capacity?: number;
  description?: string;
  status: string;
  brand?: { name: string };
  category?: { name: string };
  images?: { id: number; image_url: string; is_primary?: boolean }[];
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.id;

  const [car, setCar] = useState<CarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!carId) return;

    async function loadDetail() {
      try {
        const res = await apiFetch(`/cars/${carId}`);
        const detail = res?.data || res;
        setCar(detail);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat detail mobil');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [carId]);

  const handleActionClick = (action: 'test-drive' | 'order') => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Silakan login terlebih dahulu untuk melanjutkan.');
      router.push('/login');
      return;
    }
    router.push(`/bookings?car_id=${car?.id}&type=${action}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
        <p className="text-slate-400 animate-pulse">Memuat detail unit mobil...</p>
      </main>
    );
  }

  if (error || !car) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
        <div className="p-6 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-sm">
          {error || 'Unit mobil tidak ditemukan.'}
        </div>
        <Link href="/" className="inline-block mt-4 text-sm text-blue-400 hover:underline">
          ← Kembali ke Katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-6 transition"
        >
          ← Kembali ke Katalog Mobil
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Gambar & Deskripsi */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              {car.images && car.images.length > 0 ? (
                <img
                  src={car.images[0].image_url}
                  alt={car.model_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6">
                  <p className="text-slate-500 text-sm font-medium">
                    Foto unit belum diunggah
                  </p>
                  <p className="text-slate-600 text-xs mt-1">
                    {car.brand?.name} {car.model_name} ({car.year})
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Spesifikasi Lengkap
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="block text-xs text-slate-500">Merek</span>
                  <span className="text-slate-200 font-medium">{car.brand?.name || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Kategori</span>
                  <span className="text-slate-200 font-medium">{car.category?.name || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Tahun</span>
                  <span className="text-slate-200 font-medium">{car.year}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Kilometer</span>
                  <span className="text-slate-200 font-medium">
                    {car.mileage?.toLocaleString('id-ID')} km
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Transmisi</span>
                  <span className="text-slate-200 font-medium">{car.transmission}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Bahan Bakar</span>
                  <span className="text-slate-200 font-medium">{car.fuel_type}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Warna</span>
                  <span className="text-slate-200 font-medium">{car.color || '-'}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500">Kondisi</span>
                  <span className="text-slate-200 font-medium capitalize">{car.condition || '-'}</span>
                </div>
                {car.engine_capacity && (
                  <div>
                    <span className="block text-xs text-slate-500">Kapasitas Mesin</span>
                    <span className="text-slate-200 font-medium">{car.engine_capacity} cc</span>
                  </div>
                )}
              </div>

              {car.description && (
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">
                    Deskripsi Unit
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {car.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Harga & Tombol Aksi */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">
                  {car.brand?.name} • {car.year}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-medium uppercase bg-emerald-500/10 text-emerald-400">
                  {car.status}
                </span>
              </div>

              <h1 className="text-xl font-bold text-white">{car.model_name}</h1>
              <p className="text-2xl font-bold text-emerald-400 mt-3">
                Rp {Number(car.price).toLocaleString('id-ID')}
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => handleActionClick('test-drive')}
                  disabled={car.status !== 'available'}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition cursor-pointer"
                >
                  Jadwalkan Test Drive
                </button>
                <button
                  onClick={() => handleActionClick('order')}
                  disabled={car.status !== 'available'}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 text-sm font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Ajukan Pembelian
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}