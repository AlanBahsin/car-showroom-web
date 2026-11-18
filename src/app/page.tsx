'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const BACKEND_ORIGIN = 'http://localhost:8080';

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
  is_featured?: boolean;
  brand?: { id: number; name: string };
  category?: { id: number; name: string };
  images?: { id: number; image_url: string; is_primary: boolean }[];
  specification?: {
    engine_capacity: number;
    horsepower: number;
    seat_capacity: number;
    fuel_consumption: number;
  };
}

interface Brand {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

function extractArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.cars)) return raw.data.cars;
  return [];
}

function resolveCarImage(car: Car): string {
  if (car.images && car.images.length > 0) {
    const primary = car.images.find((img) => img.is_primary) || car.images[0];
    if (primary?.image_url) {
      return primary.image_url.startsWith('http')
        ? primary.image_url
        : `${BACKEND_ORIGIN}${primary.image_url}`;
    }
  }
  // Fallback visual showroom berkelas jika admin belum upload foto
  return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80';
}

export default function HomePage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTrans, setSelectedTrans] = useState('');
  const [onlyWishlisted, setOnlyWishlisted] = useState(false);

  // Compare States
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [comparedCars, setComparedCars] = useState<Car[] | null>(null);
  const [comparing, setComparing] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [carsRes, brandsRes, catsRes] = await Promise.allSettled([
          apiFetch('/cars?limit=50'),
          apiFetch('/brands'),
          apiFetch('/categories'),
        ]);

        if (carsRes.status === 'fulfilled') setCars(extractArray(carsRes.value));
        if (brandsRes.status === 'fulfilled') setBrands(extractArray(brandsRes.value));
        if (catsRes.status === 'fulfilled') setCategories(extractArray(catsRes.value));

        const token = localStorage.getItem('token');
        if (token) {
          try {
            const wishRes = await apiFetch('/buyer/wishlists');
            const wishList = extractArray(wishRes);
            setWishlistIds(wishList.map((w: any) => Number(w.car_id || w.car?.id)));
          } catch {
            // Abaikan
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadInitial();
  }, []);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const fullName = `${car.brand?.name || ''} ${car.model_name}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;
      if (selectedBrand && String(car.brand?.id) !== selectedBrand) return false;
      if (selectedCategory && String(car.category?.id) !== selectedCategory) return false;
      if (selectedTrans && car.transmission.toLowerCase() !== selectedTrans.toLowerCase())
        return false;
      if (onlyWishlisted && !wishlistIds.includes(car.id)) return false;
      return true;
    });
  }, [cars, search, selectedBrand, selectedCategory, selectedTrans, onlyWishlisted, wishlistIds]);

  const toggleWishlist = async (carId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const exists = wishlistIds.includes(carId);
    try {
      if (exists) {
        await apiFetch(`/buyer/wishlists/${carId}`, { method: 'DELETE' });
        setWishlistIds((prev) => prev.filter((id) => id !== carId));
      } else {
        await apiFetch('/buyer/wishlists', {
          method: 'POST',
          body: JSON.stringify({ car_id: carId }),
        });
        setWishlistIds((prev) => [...prev, carId]);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui wishlist');
    }
  };

  const toggleCompare = (carId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(carId)) return prev.filter((id) => id !== carId);
      if (prev.length >= 3) {
        alert('Maksimal 3 unit mobil untuk dibandingkan sekaligus.');
        return prev;
      }
      return [...prev, carId];
    });
  };

  const handleOpenCompare = async () => {
    if (compareIds.length < 2) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setComparing(true);
    try {
      const res = await apiFetch('/buyer/cars/compare', {
        method: 'POST',
        body: JSON.stringify({ car_ids: compareIds }),
      });
      const list = extractArray(res);
      setComparedCars(list.length > 0 ? list : cars.filter((c) => compareIds.includes(c.id)));
    } catch {
      setComparedCars(cars.filter((c) => compareIds.includes(c.id)));
    } finally {
      setComparing(false);
    }
  };

  const availableCount = cars.filter((c) => c.status === 'available').length;

  return (
    <main className="min-h-screen pb-28 bg-[#090b10]">
      {/* HERO SHOWROOM SECTION */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* Background Visual */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#090b10] via-[#090b10]/90 to-[#090b10]/60" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/25 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                Certified Automotive Gallery
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.12]">
              Standar Baru Memilih{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-amber-400 to-amber-500">
                Kendaraan Impian
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base mt-5 max-w-xl leading-relaxed">
              Setiap unit melalui inspeksi 175 titik dengan riwayat servis terverifikasi. Gunakan
              konsultan digital berbasis <strong className="text-white">Metode SAW</strong> untuk
              menemukan unit paling presisi sesuai anggaran Anda.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/saw"
                className="px-6 py-3.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-xl shadow-amber-500/20 transition"
              >
                Rekomendasi Cerdas (SAW)
              </Link>
              <a
                href="#koleksi"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-semibold uppercase tracking-wider backdrop-blur transition"
              >
                Lihat Koleksi ({cars.length} Unit)
              </a>
            </div>
          </div>

          {/* Prestige Showroom Stats Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl">
              <p className="text-[11px] uppercase tracking-[0.22em] text-amber-400 font-semibold">
                Showroom Overview
              </p>
              <div className="grid grid-cols-2 gap-6 mt-5 pb-6 border-b border-white/10">
                <div>
                  <span className="text-3xl font-bold text-white">{availableCount}</span>
                  <span className="block text-xs text-slate-400 mt-1">Unit Siap Kirim</span>
                </div>
                <div>
                  <span className="text-3xl font-bold text-amber-400">{brands.length}</span>
                  <span className="block text-xs text-slate-400 mt-1">Merek Ternama</span>
                </div>
              </div>
              <ul className="mt-5 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <span className="text-amber-400">✦</span> Garansi Mesin & Transmisi 1 Tahun
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-amber-400">✦</span> Simulasi Kredit Bunga Kompetitif
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-amber-400">✦</span> Layanan Private Test Drive di Showroom
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* KOLEKSI & INTERACTIVE FILTER */}
      <section id="koleksi" className="max-w-7xl mx-auto px-6 pt-12">
        {/* Category Pill Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('');
                setOnlyWishlisted(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedCategory === '' && !onlyWishlisted
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              Semua Koleksi
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(String(cat.id));
                  setOnlyWishlisted(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === String(cat.id)
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOnlyWishlisted((prev) => !prev)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
              onlyWishlisted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            ♥ Favorit Saya ({wishlistIds.length})
          </button>
        </div>

        {/* Search & Dropdown Filter Bar */}
        <div className="p-4 rounded-2xl bg-[#10131c] border border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari model kendaraan..."
            className="px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">Semua Merek</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTrans}
            onChange={(e) => setSelectedTrans(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#090b10] border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">Semua Transmisi</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedBrand('');
              setSelectedCategory('');
              setSelectedTrans('');
              setOnlyWishlisted(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider border border-white/10 transition cursor-pointer"
          >
            Reset Filter
          </button>
        </div>

        {/* Grid Kartu Kendaraan */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-96 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
            <p className="text-slate-400 text-sm">
              Tidak ada unit yang cocok dengan kriteria filter Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredCars.map((car) => {
              const imgUrl = resolveCarImage(car);
              const isWishlisted = wishlistIds.includes(car.id);
              const isCompared = compareIds.includes(car.id);

              return (
                <article
                  key={car.id}
                  className="group rounded-2xl bg-[#10131c] border border-white/10 hover:border-amber-400/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-xl shadow-black/40"
                >
                  <div>
                    {/* Visual Image Container */}
                    <div className="relative h-56 bg-slate-950 overflow-hidden">
                      <img
                        src={imgUrl}
                        alt={car.model_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#10131c] via-transparent to-black/30" />

                      {/* Status Badge */}
                      <span
                        className={`absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          car.status === 'available'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                            : car.status === 'booked'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-red-500/20 text-red-300 border border-red-400/30'
                        }`}
                      >
                        {car.status === 'available' ? 'Ready Stock' : car.status}
                      </span>

                      {/* Wishlist Heart Button */}
                      <button
                        type="button"
                        onClick={() => toggleWishlist(car.id)}
                        title="Simpan ke Favorit"
                        className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center text-sm backdrop-blur-md border transition cursor-pointer ${
                          isWishlisted
                            ? 'bg-rose-500/25 border-rose-400/50 text-rose-400'
                            : 'bg-black/50 border-white/15 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isWishlisted ? '♥' : '♡'}
                      </button>

                      {/* Year & Category Tag on Image Bottom */}
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-300">
                        <span className="px-2.5 py-0.5 rounded bg-black/60 backdrop-blur border border-white/10">
                          {car.category?.name || 'Showroom'}
                        </span>
                        <span className="font-semibold text-amber-300">{car.year}</span>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-6">
                      <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">
                        {car.brand?.name || 'Authorized Unit'}
                      </p>
                      <Link
                        href={`/cars/${car.id}`}
                        className="text-lg font-bold text-white group-hover:text-amber-300 transition line-clamp-1 mt-0.5"
                      >
                        {car.model_name}
                      </Link>

                      <p className="text-xl font-bold text-amber-400 mt-3">
                        Rp {Number(car.price).toLocaleString('id-ID')}
                      </p>

                      {/* Specs Grid */}
                      <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                            Transmisi
                          </span>
                          <strong className="text-slate-200 font-medium">{car.transmission}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                            Bahan Bakar
                          </span>
                          <strong className="text-slate-200 font-medium">{car.fuel_type}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                            Odometer
                          </span>
                          <strong className="text-slate-200 font-medium">
                            {Number(car.mileage || 0).toLocaleString('id-ID')} km
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="px-6 pb-6 flex items-center gap-2.5">
                    <Link
                      href={`/cars/${car.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-amber-400 text-white hover:text-slate-950 text-xs font-bold uppercase tracking-wider text-center transition"
                    >
                      Lihat Detail
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleCompare(car.id)}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        isCompared
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-[#090b10] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isCompared ? '✓ Dipilih' : '+ Banding'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* FLOATING COMPARE BAR */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl px-6 py-4 rounded-2xl bg-[#10131c]/95 backdrop-blur-xl border border-amber-400/40 shadow-2xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-200">
            <strong className="text-amber-400">{compareIds.length} dari 3 unit</strong> siap
            dibandingkan
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              disabled={compareIds.length < 2 || comparing}
              onClick={handleOpenCompare}
              className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {comparing ? 'Memuat...' : 'Bandingkan Unit'}
            </button>
          </div>
        </div>
      )}

      {/* MODAL PERBANDINGAN SPESIFIKASI */}
      {comparedCars && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-[#10131c] border border-white/15 p-6 sm:p-8 max-h-[88vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold">
                  Side-by-Side Comparison
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">Perbandingan Spesifikasi</h2>
              </div>
              <button
                type="button"
                onClick={() => setComparedCars(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Tutup ✕
              </button>
            </div>

            <div className="overflow-x-auto mt-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-3.5 pr-4">Parameter</th>
                    {comparedCars.map((c) => (
                      <th key={c.id} className="py-3.5 px-4 text-white font-bold text-sm">
                        {c.brand?.name} {c.model_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-slate-300">
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Harga OTR</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4 font-bold text-amber-400 text-sm">
                        Rp {Number(c.price).toLocaleString('id-ID')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Tahun Produksi</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">{c.year}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Transmisi & BBM</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">
                        {c.transmission} • {c.fuel_type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Odometer</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">
                        {Number(c.mileage || 0).toLocaleString('id-ID')} km
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Kapasitas Mesin</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">
                        {c.specification?.engine_capacity || '-'} cc
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Kapasitas Kursi</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">
                        {c.specification?.seat_capacity || '-'} Penumpang
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 pr-4 text-slate-400">Konsumsi BBM</td>
                    {comparedCars.map((c) => (
                      <td key={c.id} className="py-3.5 px-4">
                        {c.specification?.fuel_consumption || '-'} km/L
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}