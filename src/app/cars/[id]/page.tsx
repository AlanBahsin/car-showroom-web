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
  const [activeImage, setActiveImage] = useState<string>(
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80'
  );
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
      <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto bg-[#090b10]">
        <p className="text-slate-400 animate-pulse text-sm">Memuat spesifikasi kendaraan...</p>
      </main>
    );
  }

  if (!car) {
    return (
      <main className="min-h-screen px-6 py-10 max-w-7xl mx-auto bg-[#090b10]">
        <p className="text-red-400 text-sm">Unit mobil tidak ditemukan.</p>
        <Link href="/" className="text-amber-400 text-xs underline mt-2 inline-block">
          ← Kembali ke Koleksi Showroom
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 bg-[#090b10]">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-400 hover:text-amber-400 transition mb-6"
        >
          ← Kembali ke Koleksi Showroom
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolom Kiri: Galeri & Spesifikasi Teknis */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl bg-[#10131c] border border-white/10 overflow-hidden shadow-2xl">
              <div className="h-80 sm:h-[420px] bg-slate-950 relative">
                <img
                  src={activeImage}
                  alt={car.model_name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#10131c]/70 via-transparent to-transparent" />
              </div>

              {car.images && car.images.length > 1 && (
                <div className="p-4 flex gap-3 overflow-x-auto bg-[#10131c] border-t border-white/10">
                  {car.images.map((img) => {
                    const fullUrl = img.image_url.startsWith('http')
                      ? img.image_url
                      : `${BACKEND_ORIGIN}${img.image_url}`;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveImage(fullUrl)}
                        className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                          activeImage === fullUrl
                            ? 'border-amber-400 scale-105'
                            : 'border-transparent opacity-55 hover:opacity-100'
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
            <div className="rounded-2xl bg-[#10131c] border border-white/10 p-6 sm:p-8">
              <span className="text-[10px] uppercase tracking-[0.22em] text-amber-400 font-semibold">
                Technical Specifications
              </span>
              <h2 className="text-lg font-bold text-white mt-1 mb-5">Spesifikasi & Kondisi Unit</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Tahun Produksi</span>
                  <strong className="text-white text-sm mt-1 block">{car.year}</strong>
                </div>
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Transmisi</span>
                  <strong className="text-white text-sm mt-1 block">{car.transmission}</strong>
                </div>
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Bahan Bakar</span>
                  <strong className="text-white text-sm mt-1 block">{car.fuel_type}</strong>
                </div>
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Jarak Tempuh</span>
                  <strong className="text-white text-sm mt-1 block">
                    {Number(car.mileage || 0).toLocaleString('id-ID')} km
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Kapasitas Mesin</span>
                  <strong className="text-white text-sm mt-1 block">
                    {car.specification?.engine_capacity || '-'} cc
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10">
                  <span className="text-slate-500 block">Kapasitas Penumpang</span>
                  <strong className="text-white text-sm mt-1 block">
                    {car.specification?.seat_capacity || '-'} Kursi
                  </strong>
                </div>
              </div>

              {car.description && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold block mb-2">
                    Catatan Inspeksi Showroom
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">{car.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Harga, CTA Booking & Simulasi Kredit */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[#10131c] border border-white/10 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                  {car.category?.name || 'Authorized Unit'}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
                    car.status === 'available'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                  }`}
                >
                  {car.status === 'available' ? 'Ready Stock' : car.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3">
                {car.brand?.name ? `${car.brand.name} ` : ''}
                {car.model_name}
              </h1>

              <p className="text-3xl font-bold text-amber-400 mt-4">
                Rp {Number(car.price).toLocaleString('id-ID')}
              </p>

              <div className="mt-7 space-y-3">
                <button
                  type="button"
                  disabled={car.status !== 'available'}
                  onClick={() => router.push(`/bookings?car_id=${car.id}&type=test-drive`)}
                  className="w-full py-3.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Jadwalkan Private Test Drive
                </button>
                <button
                  type="button"
                  disabled={car.status !== 'available'}
                  onClick={() => router.push(`/bookings?car_id=${car.id}&type=order`)}
                  className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider border border-white/15 transition cursor-pointer"
                >
                  Pesan / Beli Unit Ini
                </button>
              </div>
            </div>

            {/* Widget Simulasi Kredit */}
            <form
              onSubmit={handleSimulateCredit}
              className="rounded-2xl bg-[#10131c] border border-white/10 p-6 sm:p-8 space-y-4"
            >
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                  Financial Calculator
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">Simulasi Kredit Leasing</h2>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Uang Muka / DP (Rp)</label>
                <input
                  type="number"
                  min={5000000}
                  max={car.price - 5000000}
                  step={5000000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1.5">Tenor Cicilan</label>
                <select
                  value={tenorMonths}
                  onChange={(e) => setTenorMonths(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
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
                className="w-full py-3 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/35 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {simLoading ? 'Menghitung...' : 'Hitung Estimasi Cicilan'}
              </button>

              {simResult && (
                <div className="p-4 rounded-xl bg-[#090b10] border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Pokok Pinjaman</span>
                    <span className="text-slate-200 font-medium">
                      Rp {Number(simResult.principal_loan).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Suku Bunga Flat</span>
                    <span className="text-slate-200 font-medium">
                      {simResult.annual_interest_rate}% / tahun
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-white/10 flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">Estimasi Cicilan</span>
                    <span className="text-base font-bold text-amber-400">
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