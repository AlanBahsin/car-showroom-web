'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const BACKEND_ORIGIN = 'http://localhost:8080';

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
  status: string;
  description?: string;
  brand?: { name: string };
  category?: { name: string };
  images?: { id: number; image_url: string; is_primary: boolean }[];
  specification?: {
    engine_capacity: number;
    horsepower: number;
    seat_capacity: number;
    fuel_consumption: number;
    tax_expiry_date?: string;
    service_book_status?: boolean;
  };
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params?.id;

  const [car, setCar] = useState<CarDetail | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulasi Kredit State
  const [downPayment, setDownPayment] = useState<number>(50000000);
  const [tenorMonths, setTenorMonths] = useState<number>(36);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    if (!carId) return;
    async function loadCar() {
      try {
        const res = await apiFetch(`/cars/${carId}`);
        const data: CarDetail = res?.data || res;
        setCar(data);

        if (data?.price) {
          setDownPayment(Math.round(data.price * 0.25));
        }

        if (data?.images && data.images.length > 0) {
          const first = data.images.find((i) => i.is_primary) || data.images[0];
          const url = first.image_url.startsWith('http')
            ? first.image_url
            : `${BACKEND_ORIGIN}${first.image_url}`;
          setActiveImage(url);
        }
      } finally {
        setLoading(false);
      }
    }
    loadCar();
  }, [carId]);

  const handleSimulateCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car) return;
    setSimLoading(true);
    try {
      const res = await apiFetch('/credit-simulation', {
        method: 'POST',
        body: JSON.stringify({
          car_price: car.price,
          down_payment: Number(downPayment),
          tenor_months: Number(tenorMonths),
          annual_interest: 6.0,
        }),
      });
      setSimResult(res?.data || res);
    } catch (err: any) {
      alert(err.message || 'Gagal menghitung simulasi kredit');
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
        <p className="text-slate-400 animate-pulse text-sm">Memuat detail kendaraan...</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
        <p className="text-red-400 text-sm">Unit mobil tidak ditemukan.</p>
        <Link href="/" className="text-blue-400 text-xs underline mt-2 inline-block">
          ← Kembali ke Katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-6"
        >
          ← Kembali ke Katalog Showroom
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri: Galeri & Spesifikasi Teknis */}
          <div className="lg:col-span-7 space-y-6">
            {/* Galeri Utama */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="h-80 sm:h-96 bg-slate-950 flex items-center justify-center">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={car.model_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <p className="text-sm font-semibold">
                      {car.brand?.name} {car.model_name}
                    </p>
                    <p className="text-xs mt-1">Belum ada foto unit terunggah</p>
                  </div>
                )}
              </div>

              {car.images && car.images.length > 1 && (
                <div className="p-3 flex gap-2 overflow-x-auto bg-slate-900 border-t border-slate-800">
                  {car.images.map((img) => {
                    const fullUrl = img.image_url.startsWith('http')
                      ? img.image_url
                      : `${BACKEND_ORIGIN}${img.image_url}`;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImage(fullUrl)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                          activeImage === fullUrl ? 'border-blue-500' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={fullUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabel Spesifikasi */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <h2 className="text-base font-bold text-white mb-4">Spesifikasi & Kondisi Unit</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Tahun</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">{car.year}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Transmisi</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">{car.transmission}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Bahan Bakar</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">{car.fuel_type}</strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Jarak Tempuh</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">
                    {Number(car.mileage || 0).toLocaleString('id-ID')} km
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Kapasitas Mesin</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">
                    {car.specification?.engine_capacity || '-'} cc
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-500 block">Kapasitas Kursi</span>
                  <strong className="text-slate-200 text-sm mt-0.5 block">
                    {car.specification?.seat_capacity || '-'} Penumpang
                  </strong>
                </div>
              </div>

              {car.description && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-400 block mb-1">Catatan Inspeksi</span>
                  <p className="text-sm text-slate-300 leading-relaxed">{car.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Harga, CTA Booking & Simulasi Kredit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400 font-semibold uppercase">
                  {car.category?.name || 'Unit Showroom'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {car.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white mt-2">
                {car.brand?.name ? `${car.brand.name} ` : ''}
                {car.model_name}
              </h1>

              <p className="text-3xl font-bold text-emerald-400 mt-4">
                Rp {Number(car.price).toLocaleString('id-ID')}
              </p>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={car.status !== 'available'}
                  onClick={() => router.push(`/bookings?car_id=${car.id}&type=test-drive`)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold transition cursor-pointer"
                >
                  Jadwalkan Test Drive
                </button>
                <button
                  type="button"
                  disabled={car.status !== 'available'}
                  onClick={() => router.push(`/bookings?car_id=${car.id}&type=order`)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-sm font-semibold border border-slate-700 transition cursor-pointer"
                >
                  Pesan / Beli Unit Ini
                </button>
              </div>
            </div>

            {/* Widget Simulasi Kredit */}
            <form
              onSubmit={handleSimulateCredit}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-white">Simulasi Kredit Leasing</h2>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Uang Muka / DP (Rp)
                </label>
                <input
                  type="number"
                  min={5000000}
                  max={car.price - 5000000}
                  step={5000000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tenor Cicilan</label>
                <select
                  value={tenorMonths}
                  onChange={(e) => setTenorMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value={12}>12 Bulan (1 Tahun)</option>
                  <option value={24}>24 Bulan (2 Tahun)</option>
                  <option value={36}>36 Bulan (3 Tahun)</option>
                  <option value={48}>48 Bulan (4 Tahun)</option>
                  <option value={60}>60 Bulan (5 Tahun)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              >
                {simLoading ? 'Menghitung...' : 'Hitung Estimasi Cicilan'}
              </button>

              {simResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Pokok Pinjaman</span>
                    <span className="text-slate-200">
                      Rp {Number(simResult.principal_loan).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Suku Bunga Flat</span>
                    <span className="text-slate-200">{simResult.annual_interest_rate}% / tahun</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300 font-medium">Estimasi Cicilan</span>
                    <span className="text-base font-bold text-emerald-400">
                      Rp {Number(simResult.monthly_installment).toLocaleString('id-ID')}/bln
                    </span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}